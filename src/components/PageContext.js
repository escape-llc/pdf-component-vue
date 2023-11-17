const COLD = 0, WARM = 1, HOT = 2;
const WIDTH = 0, HEIGHT = 1;

import { ref } from "vue";

/**
 * Feature-detect OffscreenCanvas and use it, else DOM element canvas.
 * @param {Number} width canvas width in px.
 * @param {Number} height canvas height in px.
 * @returns {OffscreenCanvas|HTMLCanvasElement} a canvas of some sort.
 */
const canvasFactory = (width, height) => {
	if(typeof globalThis.OffscreenCanvas !== "undefined") {
		const oc = new globalThis.OffscreenCanvas(width, height);
		return oc;
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}
/**
 * This class represents the current state of the page.
 */
class PageContext {
	id
	container = null
	canvas = null
	divText = null
	divAnno = null
	stateReactive = ref(COLD)
	sizeMode = WIDTH
	index
	pageNumber
	pageLabel
	gridRow
	gridColumn
	rotation
	didRender = false
	/**
	 * Ctor.
	 * @param {Number} sm size mode WIDTH,HEIGHT.
	 * @param {String} id page container ID.
	 * @param {Number} index 0-relative index.
	 * @param {Number} pageNumber 1-relative page number.
	 * @param {String} pageLabel string version of page number, e.g. "iii".
	 */
	constructor(sm, id, index, pageNumber, pageLabel) {
		this.sizeMode = sm;
		this.id = id;
		this.index = index;
		this.pageNumber = pageNumber;
		this.pageLabel = pageLabel;
	}
	is(state) { return state === this.state; }
	get state() { return this.stateReactive.value; }
	set state(vx) { this.stateReactive.value = vx; }
	/**
	 * Initialize the grid coordinates.
	 * @param {Number} row 1-relative grid row.
	 * @param {Number} col 1-relative grid column.
	 */
	grid(row, col) {
		this.gridRow = row;
		this.gridColumn = col;
	}
	/**
	 * Mount/unmount the page container element.
	 * @param {HTMLDivElement|null} container page container element.
	 */
	mountContainer(container) {
		this.container = container;
		if(!container) {
			this.didRender = false;
			return;
		}
	}
	mountCanvas(canvas) {
		this.canvas = canvas;
	}
	mountTextLayer(el) {
		this.divText = el;
	}
	mountAnnotationLayer(el) {
		this.divAnno = el;
	}
	/**
	 * Compute the viewport and set the special CSS properties.
	 * --scale-factor   Used by PDFJS
	 * --viewport-xxx   Made available for client CSS rules
	 * @param {PageCache} cache Use for page operations.
	 * @returns viewport
	 */
	containerViewport(cache) {
		const viewport = cache.viewport(this.pageNumber, this.sizeMode, this.container.clientWidth, this.container.clientHeight, this.rotation || 0);
		this.container.style.setProperty("--scale-factor", viewport.scale);
		this.container.style.setProperty("--viewport-width", Math.floor(viewport.width));
		this.container.style.setProperty("--viewport-height", Math.floor(viewport.height));
		return viewport;
	}
	/**
	 * Perform a full render of page contents; sets didRender flag.
	 * @param {PageCache} cache use for page operations.
	 */
	async render(cache) {
		if(!this.container) return;
		if(this.didRender) return;
		const viewport = this.containerViewport(cache);
		if(this.canvas) {
			this.canvas.width = viewport.width;
			this.canvas.height = viewport.height;
		}
		this.didRender = true;
		if(this.state !== HOT) {
			// the cause of this is fixed, deprecate
			if(this.divText || this.divAnno) console.error("OMFG", this.id, this.state);
			this.divText?.replaceChildren();
			this.divAnno?.replaceChildren();
		}
		else {
			if(this.canvas) {
				await this.renderTheCanvas(cache, viewport);
			}
			if(this.divText) {
				this.divText.replaceChildren();
				await cache.renderTextLayer(this.pageNumber, viewport, this.divText);
			}
			if(this.divAnno) {
				this.divAnno.replaceChildren();
				await cache.renderAnnotationLayer(this.pageNumber, viewport, this.divAnno);
			}
		}
	}
	/**
	 * Render to an (Offscreen)Canvas then use requestAnimationFrame() for a smooth update.
	 * @param {PageCache} cache Use for page operations.
	 * @param {Viewport} viewport Use to size everything.
	 * @returns Promise
	 */
	async renderTheCanvas(cache, viewport) {
		if(!this.canvas) return;
		const oc = canvasFactory(viewport.width, viewport.height);
		await cache.renderCanvas(this.pageNumber, viewport, oc);
		requestAnimationFrame(() => {
			if(!this.canvas) return;
			this.canvas.width = viewport.width;
			this.canvas.height = viewport.height;
			const ctx = this.canvas.getContext("2d");
			ctx.drawImage(oc, 0, 0);
		});
	}
	/**
	 * Perform the resize pass.
	 * Only performs if didRender is TRUE.
	 * @param {PageCache} cache Use for page operations.
	 * @param {Boolean} draw true: redraw canvas; false: update CSS only.
	 * @returns Promise
	 */
	async resize(cache, draw) {
		if(!this.container) return;
		if(!this.didRender) return;
		const viewport = this.containerViewport(cache);
		if(this.state === HOT) {
			if(this.canvas && draw === true) {
				await this.renderTheCanvas(cache, viewport);
			}
		}
	}
	/**
	 * Switch to the HOT state.
	 * Resets didRender flag.
	 * @param {Number} rotation document-level rotation.
	 */
	hot(rotation) {
		this.rotation = rotation;
		this.state = HOT;
		this.didRender = false;
	}
	/**
	 * Switch to the COLD state.
	 * Resets didRender flag.
	 */
	cold() {
		this.state = COLD;
		this.didRender = false;
	}
	/**
	 * Switch to the WARM state.
	 * Resets didRender flag.
	 * @param {Number} rotation document-level rotation.
	 */
	warm(rotation) {
		this.rotation = rotation;
		this.state = WARM;
		this.didRender = false;
	}
		/**
		 * Create a disconnected wrapper object for the page that is "safe" for external callers.
		 * @param {Event} ev original event, if any.
		 * @returns {any} untyped info { id, index, state, pageNumber, gridRow, gridColumn, originalEvent? }.
		 */
		infoFor(ev) {
			return {
				id: this.id,
				index: this.index,
				state: this.state,
				pageNumber: this.pageNumber,
				gridRow: this.gridRow,
				gridColumn: this.gridColumn,
				originalEvent: ev
			};
		}
}
/**
 * Populate the given array with "empty" pages in COLD zone.
 * @param {Number} sizeMode the size mode.
 * @param {String} id bsae element id.
 * @param {Number} numPages number of pages to generate.
 * @param {Array} list output array.
 */
const materializePages = (sizeMode, id, numPages, list) => {
	for(let ix = 0; ix < numPages; ix++) {
		const page = ix + 1;
		list.push(new PageContext(sizeMode, `${id}-page-${page}`, ix, page, page.toString()));
	}
}
/**
 * Calculate which zone the page index is in.
 * @param {Number} pageIndex page index 0-relative.
 * @param {Number} currentPageIndex  current page index 0-relative.
 * @param {Number} pageCount  page count.
 * @param {Number|undefined} hotzone size of HOT zone.
 * @param {Number|undefined} warmzone size of WARM zone.
 * @returns HOT|WARM|COLD|undefined.
 */
const pageZone = (pageIndex, currentPageIndex, pageCount, hotzone, warmzone) => {
	const distance = pageIndex - currentPageIndex;
	if(Math.abs(distance) >= pageCount) return undefined;
	if(hotzone === undefined) return HOT;
	if(Math.abs(distance) <= hotzone) return HOT;
	if(warmzone === undefined) return WARM;
	if(Math.abs(distance) <= hotzone + warmzone) return WARM;
	return COLD;
}

export {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	PageContext,
	materializePages, pageZone
}