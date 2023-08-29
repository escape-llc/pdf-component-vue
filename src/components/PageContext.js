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
	#cache
	#id
	#state = COLD
	#sizeMode = WIDTH
	viewport
	#index
	#pageNumber
	#pageTitle
	#gridRow
	#gridColumn
	#rotation
	#didRender = false
	#renderText = true
	#renderAnno = true
	/**
	 * Ctor.
	 * @param {PageCache} cache required to render pages.
	 * @param {Number} sm size mode WIDTH,HEIGHT.
	 * @param {String} id page container ID.
	 * @param {Number} index 0-relative index.
	 * @param {Number} pageNumber 1-relative page number.
	 * @param {String} pageTitle string version of page number, e.g. "iii".
	 */
	constructor(cache, sm, id, index, pageNumber, pageTitle) {
		this.#cache = cache;
		this.#sizeMode = sm;
		this.#id = id;
		this.#index = index;
		this.#pageNumber = pageNumber;
		this.#pageTitle = pageTitle;
	}
	/**
	 * This is entirely so Vue does not apply Proxy to instances of PageContext.
	 * @returns new instance.
	 */
	wrapper() {
		return {
			id: this.#id,
			state: this.#state,
			index: this.#index,
			pageNumber: this.pageNumber,
			gridRow: this.row,
			gridColumn: this.column,
			textLayer: this.#renderText,
			annotationLayer: this.#renderAnno,
			pageTitle: this.pageTitle,
			render: async (container, canvas, div1, div2) => {
				await this.render(container, canvas, div1, div2);
			},
			placeholder: (container, canvas) => {
				this.placeholder(container, canvas);
			}
		};
	}
	get row() { return this.#gridRow || (this.#index + 1); }
	get column() { return this.#gridColumn; }
	get id() { return this.#id; }
	get state() { return this.#state; }
	get index() { return this.#index; }
	get pageNumber() { return this.#pageNumber; }
	get pageTitle() { return this.#pageTitle; }
	is(state) { return state === this.#state; }
	grid(row, col) {
		this.#gridRow = row;
		this.#gridColumn = col;
	}
	layers(text, anno) {
		this.#renderText = text;
		this.#renderAnno = anno;
	}
	#configure(viewport, container, canvas) {
		container.style.setProperty("--scale-factor", viewport.scale);
		container.style.setProperty("--viewport-width", Math.floor(viewport.width));
		container.style.setProperty("--viewport-height", Math.floor(viewport.height));
		canvas.width = viewport.width;
		canvas.height = viewport.height;
	}
	placeholder(container, canvas) {
		//console.log("placeholder didrender[index](row,col)(state,rotation)", this.#didRender, this.index, this.#gridRow, this.#gridColumn, this.state, this.#rotation);
		if(this.state !== WARM) return;
		if(!container) return;
		if(!canvas) return;
		//console.log("placeholder client(w,h)", container.clientWidth, container.clientHeight);
		const viewport = this.#cache.viewport(this.#pageNumber, this.#sizeMode, container.clientWidth, container.clientHeight, this.#rotation || 0);
		this.#configure(viewport, container, canvas);
	}
	async render(container, canvas, div1, div2) {
		//console.log("render didrender,mode[index](row,col)(state,rotation)", this.#didRender, this.#sizeMode, this.index, this.#gridRow, this.#gridColumn, this.state, this.#rotation);
		if(this.#didRender) return;
		if(this.state !== HOT) return;
		if(!container) return;
		if(!canvas) return;
		//console.log("render client(w,h)", container.clientWidth, container.clientHeight);
		const viewport = this.#cache.viewport(this.#pageNumber, this.#sizeMode, container.clientWidth, container.clientHeight, this.#rotation || 0);
		this.#configure(viewport, container, canvas);
		// MUST set this before we async anything
		this.#didRender = true;
		await this.#cache.render(
			this.#pageNumber, viewport, canvas,
			this.#renderText ? div1 : null,
			this.#renderAnno ? div2 : null
		);
	}
	/**
	 * Switch to the HOT state.
	 * @param {Number} rotation document-level rotation.
	 * @returns 
	 */
	hot(rotation) {
		console.log("hot", this.#didRender, this.#index);
		if(this.#didRender) return;
		this.#rotation = rotation;
		this.#state = HOT;
		this.#didRender = false;
	}
	/**
	 * Switch to the COLD state.
	 */
	cold() {
		console.log("cold", this.#didRender, this.#index);
		this.page = null;
		this.#state = COLD;
		this.#didRender = false;
	}
	/**
	 * Switch to the WARM state.
	 * @param {Number} rotation document-level rotation.
	 * @returns 
	 */
	warm(rotation) {
		console.log("warm", this.#didRender, this.#index);
		this.#rotation = rotation;
		this.#state = WARM;
		this.#didRender = false;
	}
}
/**
 * Populate the given array with "empty" pages in COLD zone.
 * @param {PageCache} cache the page cache.
 * @param {Number} sizeMode the size mode.
 * @param {String} id element id.
 * @param {Number} numPages number of pages to generate.
 * @param {Array} list output array.
 */
const materializePages = (cache, sizeMode, id, numPages, list) => {
	for(let ix = 0; ix < numPages; ix++) {
		const page = ix + 1;
		list.push(new PageContext(cache, sizeMode, `${id}-page-${page}`, ix, page, page.toString()));
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
/**
 * Encapsulates the state needed to process the pages for rendering.
 * Pages are evaluated first before updating the data model.
 * HOT pages cannot be rendered until they appear in the DOM (via nextTick).
 */
class RenderState {
	#currentPage
	#hotzone
	#warmzone
	#pages
	constructor(pages, currentPage, hotzone, warmzone) {
		this.#pages = pages;
		this.#currentPage = currentPage;
		this.#hotzone = hotzone;
		this.#warmzone = warmzone;
	}
	/**
	 * Determine the zone for the given page, relative to current properties.
	 * @param {PageContext} page the page.
	 * @returns the zone COLD,WARM,HOT,undefined.
	 */
	zone(page) {
		return pageZone(page.index, this.#currentPage, this.#pages.length, this.#hotzone, this.#warmzone);
	}
	/**
	 * Scan the list of pages and output a list of their current zones.
	 * @returns Array[{zone:Number,page:PageContext}] list of results.
	 */
	scan() {
		/*const list = [];
		for(let ix = 0; ix < this.#pages.length; ix++) {
			const page = this.#pages[ix];
			const zone = this.zone(page);
			list.push({zone, page});
		}*/
		const list = this.#pages.map(px => { return { zone: this.zone(px), page: px }; });
		return list;
	}
	/**
	 * Take the list of scan results and select tiles (to put into DOM).
	 * @param {Array[{zone,page}]} scan list returned from scan().
	 * @param {Number|undefined} count number of tiles; undefined for all pages.
	 * @returns Selected number of tiles; MAY be fewer depending on boundaries.
	 */
	tiles(scan, count) {
		const list = [];
		let end = count ? count : this.#pages.length;
		for(let ix = 0; ix < end; ix++) {
			if(this.#currentPage + ix >= scan.length) break;
			if(scan.zone === COLD) continue;
			list.push(scan[this.#currentPage + ix]);
		}
		return list;
	}
}

export {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	PageContext, RenderState, DocumentHandler_pdfjs,
	materializePages, pageZone
}