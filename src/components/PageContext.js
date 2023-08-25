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
 * This MUST NOT get Proxied it uses "#" properties.
 */
class PageContext {
	#id
	#state = COLD
	page
	viewport
	#index
	#pageNumber
	#pageTitle
	#gridRow
	#gridColumn
	#rotation
	#placeholderWidth
	#placeholderHeight
	#didRender = false
	renderText = true
	renderAnno = true
	constructor(id, index, pageNumber, pageTitle) {
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
			textLayer: this.renderText,
			annotationLayer: this.renderAnno,
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
	layout(page) {
		this.warm();
		this.page = page;
	}
	placeholder(container, canvas) {
		console.log("placholder [index](row,col)(state,rotation)", this.#didRender, this.index, this.#gridRow, this.#gridColumn, this.state, this.#rotation);
		if(this.state !== WARM) return;
		if(!this.page) throw new Error("placeholder: layout was not called");
		if(!container) return;
		if(!canvas) return;
		const [actualWidth, actualHeight] = getPageDimensions(
			WIDTH,
			(this.#rotation / 90) % 2
				? this.page.view[2] / this.page.view[3]
				: this.page.view[3] / this.page.view[2],
				container.clientWidth,
				container.clientHeight
		);
		console.log("placeholder actual(w,h)", actualWidth, actualHeight);
		const viewport = makeViewport(this.page, actualWidth, this.#rotation || 0);
		container.style.setProperty("--scale-factor", viewport.scale);
		canvas.width = viewport.width;
		canvas.height = viewport.height;
	}
	async render(container, canvas, div1, div2) {
		console.log("render [index](row,col)(state,rotation)", this.#didRender, this.index, this.#gridRow, this.#gridColumn, this.state, this.#rotation);
		if(this.#didRender) return;
		if(this.state !== HOT) return;
		if(!this.page) throw new Error("render: hot was not called");
		if(!container) return;
		if(!canvas) return;
		const [actualWidth, actualHeight] = getPageDimensions(
			WIDTH,
			(this.#rotation / 90) % 2
				? this.page.view[2] / this.page.view[3]
				: this.page.view[3] / this.page.view[2],
				container.clientWidth,
				container.clientHeight
		);
		console.log("render actual(w,h)", actualWidth, actualHeight);
		const viewport = makeViewport(this.page, actualWidth, this.#rotation);
		container.style.setProperty("--scale-factor", viewport.scale);
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		// MUST set this before we async anything
		this.#didRender = true;
		await this.page.render({
			canvasContext: canvas.getContext('2d'),
			viewport,
		}).promise
		if(this.renderText === true && div1) {
			await this.#textLayer(this.page, viewport, div1);
		}
		if(this.renderAnno === true && (div1 || div2)) {
			await this.#annoLayer(this.page, viewport, div1 || div2);
		}
	}
	hot(pdfPage, rotation) {
		console.log("hot", this.#didRender, this.#index);
		if(this.#didRender) return;
		this.page = pdfPage;
		this.#rotation = rotation + this.page.rotate;
		this.#state = HOT;
		this.#didRender = false;
	}
	cold() {
		this.page = null;
		this.#state = COLD;
		this.#didRender = false;
	}
	warm() {
		this.page = null;
		this.#state = WARM;
		this.#didRender = false;
	}
	async #textLayer(page, viewport, container) {
		await pdf.renderTextLayer({
			container,
			textContent: await page.getTextContent(),
			viewport,
		}).promise
	}
	async #annoLayer(page, viewport, container) {
		const options = {
			annotations: await page.getAnnotations(),
			div: container,
			linkService: this.linkService,
			page,
			renderInteractiveForms: false,
			viewport: viewport/*.clone({
				dontFlip: true,
			})*/,
			imageResourcesPath: this.imageResourcesPath,
		};
		const anno = new pdf.AnnotationLayer(options);
		anno.render(options);
	}
}
const makeViewport = (page, width, rotation) => {
	const pageWidth = (rotation / 90) % 2 ? page.view[3] : page.view[2];
	const scale = width / pageWidth;
	const viewport = page.getViewport({ scale, rotation });
	return viewport;
}
const getPageDimensions = (mode, ratio, clientWidth, clientHeight) => {
	if (mode === HEIGHT) {
		return ratio <= 1 ? [clientHeight*ratio, clientHeight] : [clientHeight*ratio, clientHeight];
	} else {
		return ratio <= 1 ? [clientWidth, clientWidth*ratio] : [clientWidth, clientWidth/ratio];
	}
}
/**
 * Populate the given array with "empty" pages in COLD zone.
 * @param {String} id element id.
 * @param {Number} numPages number of pages to generate.
 * @param {Array} list output array.
 */
const materializePages = (id, numPages, list) => {
	for(let ix = 0; ix < numPages; ix++) {
		const page = ix + 1;
		list.push(new PageContext(`${id}-page-${page}`, ix, page, page.toString()));
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
	#pageCount
	#hotzone
	#warmzone
	#pages
	constructor(pages, pageCount, currentPage, hotzone, warmzone) {
		this.#pages = pages;
		this.#pageCount = pageCount;
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
		return pageZone(page.index, this.#currentPage, this.#pageCount, this.#hotzone, this.#warmzone);
	}
	/**
	 * Scan the list of pages and output a list of their current zones.
	 * @returns Array[{zone:Number,page:PageContext}] list of results.
	 */
	scan() {
		const list = [];
		for(let ix = 0; ix < this.#pages.length; ix++) {
			const page = this.#pages[ix];
			const zone = this.zone(page);
			list.push({zone, page});
		}
		return list;
	}
	/**
	 * Take the list of scan results and select tiles (to put into DOM).
	 * @param {Array[]} scan list returned from scan().
	 * @param {*} count number of tiles; undefined for all pages.
	 * @returns Selected number of tiles; MAY be fewer depending on boundaries.
	 */
	tiles(scan, count) {
		const list = [];
		let end = count ? count : this.#pageCount;
		for(let ix = 0; ix < end; ix++) {
			if(ix < 0) continue;
			if(ix >= this.#pageCount) continue;
			if(scan.zone === COLD) continue;
			list.push(scan[this.#currentPage + ix]);
		}
		return list;
	}
	/**
	 * Traverse the list and pass "transitioning" items to the callback.
	 * @param {Array} tiles list returned from tiles()
	 * @param {Function} callback receives items transitioning.
	 */
	transition(tiles, callback) {
		tiles.forEach(tx => {
			if(tx.zone !== tx.page.state) callback(tx);
		});
	}
}

export {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	PageContext, RenderState, DocumentHandler_pdfjs,
	getPageDimensions, materializePages, pageZone, makeViewport,
}