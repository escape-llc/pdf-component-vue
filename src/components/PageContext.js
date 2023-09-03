import * as pdf from 'pdfjs-dist/build/pdf.js'

const COLD = 0, WARM = 1, HOT = 2;
const WIDTH = 0, HEIGHT = 1;

class DocumentHandler {
	get document() { return undefined; }
	async load(source) {
		throw new Error("load: not implemented");
	}
	async page(pageNum) {
		throw new Error("page: not implemented");
	}
}
/**
 * DocumentHandler bound to the PDFJS document/page objects.
 */
class DocumentHandler_pdfjs extends DocumentHandler {
	#document
	#emit
	constructor(emitter) {
		super();
		this.#emit = emitter;
	}
	get document() { return this.#document; }
	async load(source) {
		this.#document = null;
		if (source._pdfInfo) {
			this.#document = source;
		} else {
			const documentLoadingTask = pdf.getDocument(source);
			documentLoadingTask.onProgress = (progressParams) => {
				this.#emit("progress", progressParams);
			}
			documentLoadingTask.onPassword = (callback, reason) => {
				const retry = reason === pdf.PasswordResponses.INCORRECT_PASSWORD;
				this.#emit("password-requested", callback, retry);
			}
			this.#document = await documentLoadingTask.promise;
		}
		return this.#document;
	}
	async page(pageNum) {
		if(!this.#document) throw new Error("page: load was not called");
		return await this.#document.getPage(pageNum);
	}
}
/**
 * This class represents the current state of the page to child components (via wrapper).
 * This MUST NOT get Proxied it uses "#" properties.
 */
class PageContext {
	id
	container
	canvas
	divText
	divAnno
	state = COLD
	sizeMode = WIDTH
	index
	pageNumber
	pageTitle
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
	 * @param {String} pageTitle string version of page number, e.g. "iii".
	 */
	constructor(sm, id, index, pageNumber, pageTitle) {
		this.sizeMode = sm;
		this.id = id;
		this.index = index;
		this.pageNumber = pageNumber;
		this.pageTitle = pageTitle;
	}
	is(state) { return state === this.state; }
	grid(row, col) {
		this.gridRow = row;
		this.gridColumn = col;
	}
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
	async render(cache) {
		if(!this.container) return;
		if(!this.canvas) return;
		if(this.didRender) return;
		const viewport = cache.viewport(this.pageNumber, this.sizeMode, this.container.clientWidth, this.container.clientHeight, this.rotation || 0);
		this.container.style.setProperty("--scale-factor", viewport.scale);
		this.container.style.setProperty("--viewport-width", Math.floor(viewport.width));
		this.container.style.setProperty("--viewport-height", Math.floor(viewport.height));
		if(this.canvas) {
			this.canvas.width = viewport.width;
			this.canvas.height = viewport.height;
		}
		if(this.state !== HOT) {
			this.divText?.replaceChildren();
			this.divAnno?.replaceChildren();
			return;
		}
		this.didRender = true;
		try {
			await cache.renderCanvas(this.pageNumber, viewport, this.canvas);
		}
		finally {
			//this.didRender = false;
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
	/**
	 * Switch to the HOT state.
	 * Resets didRender flag.
	 * @param {Number} rotation document-level rotation.
	 */
	hot(rotation) {
		console.log("hot", this.didRender, this.index);
		this.rotation = rotation;
		this.state = HOT;
		this.didRender = false;
	}
	/**
	 * Switch to the COLD state.
	 * Resets didRender flag.
	 */
	cold() {
		console.log("cold", this.didRender, this.index);
		this.state = COLD;
		this.didRender = false;
	}
	/**
	 * Switch to the WARM state.
	 * Resets didRender flag.
	 * @param {Number} rotation document-level rotation.
	 */
	warm(rotation) {
		console.log("warm", this.didRender, this.index);
		this.rotation = rotation;
		this.state = WARM;
		this.didRender = false;
	}
}
/**
 * Populate the given array with "empty" pages in COLD zone.
 * @param {Number} sizeMode the size mode.
 * @param {String} id element id.
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
	//console.log(`pageZone(${pageIndex},${currentPageIndex},${pageCount},${hotzone},${warmzone})`, distance);
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
	PageContext, DocumentHandler_pdfjs,
	materializePages, pageZone
}