const COLD = 0, WARM = 1, HOT = 2;
const WIDTH = 0, HEIGHT = 1, SCALE = 2;

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
	sizeMode = WIDTH
	id
	index
	pageNumber
	pageLabel
	stateReactive = ref(COLD)
	gridRow
	gridColumn
	rotation = 0
	scaleFactor
	container = null
	canvas = null
	divText = null
	divAnno = null
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
		const bcr = this.container.getBoundingClientRect();
		const viewport = cache.viewport(this.pageNumber, this.sizeMode, bcr.width, bcr.height, this.rotation || 0);
		return viewport;
	}
	/**
	 * Execute the rendering pipeline.
	 * Stage 1 awaits all the actions.
	 * Stage 2 calls requestAnimationFrame() and runs all the animate actions, passing each one the resolved Promise array.
	 * The call to rAF() is NOT awaited.
	 * @param {Function[]} actions list of compute Promises (async).
	 * @param {Function[]} animate list of requestAnimationFrame actions.
	 * @returns {Promise} the continuation of executing requestAnimationFrame() returns the resolved Promise array.
	 */
	async pipeline(actions, animate) {
		return Promise.all(actions.map(async ax => await ax())).then(results => {
			requestAnimationFrame(() => {
				animate.forEach(ax => { ax(results); });
			});
			return results;
		});
	}
	/**
	 * Set the special CSS properties required by PDFJS and the component.
	 * @param {HTMLDivElement} container page container DOM element.
	 * @param {Number} scale Master scale factor.
	 * @param {Number} vw viewport width PX.
	 * @param {Number} vh viewport height PX.
	 * @param {Number} pw PDFJS page width PX.
	 * @param {Number} ph PDFJS page height PX.
	 */
	setContainerProperties(container, scale, vw, vh, pw, ph) {
		container.style.setProperty("--scale-factor", scale.toFixed(4));
		container.style.setProperty("--viewport-width", vw);
		container.style.setProperty("--viewport-height", vh);
		container.style.setProperty("--page-width", pw);
		container.style.setProperty("--page-height", ph);
	}
	/**
	 * Size and render the canvas from the local canvas.
	 * @param {HTMLCanvasElement} canvas Target canvas element.
	 * @param {OffscreenCanvas|HTMLCanvasElement} local Source canvas.
	 * @param {Number} width canvas width PX.
	 * @param {Number} height canvas height PX.
	 */
	renderLocal(canvas, local, width, height) {
		canvas.width = width;
		canvas.height = height;
		const ctx = this.canvas.getContext("2d");
		ctx.drawImage(local, 0, 0);
	}
	renderDivLayer(layer, div) {
		layer.setAttribute("style", div.getAttribute("style"));
		layer.setAttribute("data-main-rotation", div.getAttribute("data-main-rotation"));
		layer.replaceChildren(...div.children);
	}
	/**
	 * Perform all the arithmetic for rendering.
	 * @param {PageCache} cache use for page operations.
	 * @param {*} ratio DPI ratio.
	 * @returns {{ viewport, viewport2, scale, vw, vh, vwr, vhr, width, height }} results.
	 */
	renderPrepare(cache, ratio) {
		const viewport = this.containerViewport(cache);
		const viewport2 = cache.viewport(this.pageNumber, SCALE, undefined, undefined, this.rotation, viewport.scale);
		const vw = Math.floor(viewport.width);
		const vh = Math.floor(viewport.height);
		const vwr = Math.floor(viewport2.width*ratio);
		const vhr = Math.floor(viewport2.height*ratio);
		const scale = viewport.scale;
		const { width, height } = cache.dimensions(this.pageNumber, this.rotation);
		return { viewport, viewport2, scale, vw, vh, vwr, vhr, width, height };
	}
	/**
	 * Perform a full render of page contents; sets didRender flag.
	 * @param {PageCache} cache use for page operations.
	 */
	async render(cache) {
		if(!this.container) return;
		if(this.didRender) return;
		this.didRender = true;
		const ratio = window.devicePixelRatio || 1;
		const actions = [];
		const animate = [];
		const { viewport, viewport2, scale, vw, vh, vwr, vhr, width, height } = this.renderPrepare(cache, ratio);
		actions.push(async () => {
			this.scaleFactor = scale;
			const local = this.canvas;
			if(local && (this.state === WARM || local.width !== vw || local.height !== vh)) {
				// MUST do this early so it appears before the drawing starts
				// modifying dimensions clears the contents
				local.width = vw;
				local.height = vh;
			}
			return Promise.resolve(viewport);
		});
		animate.push(results => {
			if(!this.container) return;
			this.setContainerProperties(this.container, scale, vw, vh, width, height);
		});
		if(this.state === HOT) {
			if(this.canvas) {
				actions.push(async () => {
					const local = canvasFactory(vwr, vhr);
					await cache.renderCanvas(this.pageNumber, viewport2, local, ratio);
					return local;
				});
				animate.push(results => {
					if(!this.canvas) return;
					this.renderLocal(this.canvas, results[1], vwr, vhr);
				});
			}
			else {
				actions.push(() => Promise.resolve(null));
			}
			if(this.divText) {
				actions.push(async () => {
					const div = document.createElement("div");
					await cache.renderTextLayer(this.pageNumber, viewport, div);
					return div;
				});
				animate.push(results => {
					if(!this.divText) return;
					this.renderDivLayer(this.divText, results[2]);
				});
			}
			else {
				actions.push(() => Promise.resolve(null));
			}
			if(this.divAnno) {
				actions.push(async () => {
					const div = document.createElement("div");
					await cache.renderAnnotationLayer(this.pageNumber, viewport, div);
					return div;
				});
				animate.push(results => {
					if(!this.divAnno) return;
					this.renderDivLayer(this.divAnno, results[3]);
				});
			}
			else {
				actions.push(() => Promise.resolve(null));
			}
		}
		const results = await this.pipeline(actions, animate);
		//console.log("render.pipeline is done", this.pageNumber/*, results*/);
	}
	/**
	 * Perform the resize pass.
	 * Only performs if didRender is TRUE.
	 * @param {PageCache} cache Use for page operations.
	 * @param {Boolean} draw true: redraw canvas; false: update CSS only.
	 */
	async resize(cache, draw) {
		if(!this.container) return;
		if(!this.didRender) return;
		const ratio = window.devicePixelRatio || 1;
		const actions = [];
		const animate = [];
		const { viewport, viewport2, scale, vw, vh, vwr, vhr, width, height } = this.renderPrepare(cache, ratio);
		actions.push(async () => {
			this.scaleFactor = scale;
			return Promise.resolve(viewport);
		});
		animate.push(results => {
			if(!this.container) return;
			this.setContainerProperties(this.container, scale, vw, vh, width, height);
		});
		if(this.state === HOT) {
			if(this.canvas && draw === true) {
				actions.push(async () => {
					const local = canvasFactory(vwr, vhr);
					await cache.renderCanvas(this.pageNumber, viewport2, local, ratio);
					return local;
				});
				if(this.canvas) {
					animate.push(results => {
						if(!this.canvas) return;
						this.renderLocal(this.canvas, results[1], vwr, vhr);
					});
				}
			}
		}
		const results = await this.pipeline(actions, animate);
		//console.log("resize.pipeline is done", this.pageNumber/*, results*/);
	}
	/**
	 * Switch to the HOT state.
	 * Resets didRender flag.
	 * @param {Number} rotation document-level rotation.
	 */
	hot(rotation) {
		this.rotation = rotation || 0;
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
		this.rotation = rotation || 0;
		this.state = WARM;
		this.didRender = false;
	}
		/**
		 * Create a disconnected wrapper object for the page that is "safe" for external callers.
		 * @param {Event} ev original event, if any.
		 * @returns {any} untyped info { id, index, state, pageNumber, gridRow, gridColumn, scale, originalEvent? }.
		 */
		infoFor(ev) {
			return {
				id: this.id,
				index: this.index,
				state: this.state,
				pageNumber: this.pageNumber,
				gridRow: this.gridRow,
				gridColumn: this.gridColumn,
				scale: this.scaleFactor,
				rotation: this.rotation,
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
	WIDTH, HEIGHT, SCALE,
	PageContext,
	materializePages, pageZone
}