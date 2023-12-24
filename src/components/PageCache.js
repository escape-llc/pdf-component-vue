import { renderTextLayer, AnnotationLayer } from "pdfjs-dist/build/pdf.min.js";
import { WIDTH, HEIGHT, SCALE } from "./PageContext";

/**
 * Isolate all the PDFJS specific page logic in one place.
 * This should hide the PDFJS page objects from the remainder of the application.
 */
class PageCache {
	_map = new Map()
	_linkService
	_imageResourcesPath
	/**
	 * Ctor.
	 * @param {pdf.PDFLinkService} linkService Required by annotation rendering.
	 * @param {String} imageResourcesPath Path to annotation images.
	 */
	constructor(linkService, imageResourcesPath) {
		this._linkService = linkService;
		this._imageResourcesPath = imageResourcesPath;
	}
	/**
	 * Instruct cache to retain this page and its statistics.
	 * @param {Number} pageNumber 1-relative page number.
	 * @param {any} page PDFJS page object.
	 */
	retain(pageNumber, page) {
		const width = page.view[2];
		const height = page.view[3];
		const aspectRatio = width / height;
		const entry = {
			page,
			pageNumber,
			rotation: page.rotate,
			aspectRatio,
			width,
			height
		};
		this._map.set(pageNumber, entry);
	}
	/**
	 * Instruct cache to discard this page and its statistics.
	 * @param {Number} pageNumber 1-relative page number.
	 */
	evict(pageNumber) {
		this._map.delete(pageNumber);
	}
	/**
	 * Query the cache for the existence given page number.
	 * @param {Number} pageNumber 1-relative page number.
	 * @returns true: present; false: not present.
	 */
	has(pageNumber) {
		return this._map.has(pageNumber);
	}
	/**
	 * Calculate the scale for given size mode.
	 * @param {any} entry cache entry.
	 * @param {Number} mode size mode.
	 * @param {Number} width container width.
	 * @param {Number} height container height.
	 * @param {Number} rotation document-level rotation; MUST be multiple of 90.
	 * @param {Number|undefined} scale document-level scale; only used in SCALE mode.
	 * @returns {Number} the scale factor for viewport.
	 */
	scaleFor(entry, mode, width, height, rotation, scale) {
		const pageRotation = entry.rotation + rotation;
		switch(mode) {
			case WIDTH:
				const pageWidth = (pageRotation / 90) % 2 ? entry.height : entry.width;
				const scalew = width / pageWidth;
				return scalew;
			case HEIGHT:
				const pageHeight = (pageRotation / 90) % 2 ? entry.width : entry.height;
				const scaleh = height / pageHeight;
				return scaleh;
			case SCALE:
				if(!scale || !Number.parseFloat(scale) || Number.isNaN(scale)) throw new Error(`viewport: SCALE mode requires '${scale}' is a Number`);
				return scale;
		}
		throw new Error(`scaleFor: ${mode}: unknown mode`);
	}
	/**
	 * Calculate page dimensions based on rotation.
	 * @param {Number} pageNumber 1-relative page number.
	 * @param {Number} rotation Must be multiple of 90.
	 * @returns {{width: Number,height: Number,aspectRatio: Number}}
	 */
	dimensions(pageNumber, rotation) {
		if(!this._map.has(pageNumber)) throw new Error(`viewport: page ${pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		const pageRotation = entry.rotation + rotation;
		const width = (pageRotation / 90) % 2 ? entry.height : entry.width;
		const height= (pageRotation / 90) % 2 ? entry.width : entry.height;
		const aspectRatio = width / height;
		return { width, height, aspectRatio };
	}
	/**
	 * Compute the active viewport for the page and given parameters.
	 * @param {Number} pageNumber 1-relative page number.
	 * @param {Number} mode size mode WIDTH,HEIGHT.
	 * @param {Number} width container width.
	 * @param {Number} height container height.
	 * @param {Number} rotation document-level rotation.
	 * @param {Number|undefined} scale document-level scale; only used in SCALE mode.
	 * @returns new instance.
	 */
	viewport(pageNumber, mode, width, height, rotation, scale) {
		if(!this._map.has(pageNumber)) throw new Error(`viewport: page ${pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		const vscale = this.scaleFor(entry, mode, width, height, rotation, scale);
		const vp = entry.page.getViewport({ scale: vscale, rotation });
		return vp;
	}
	async renderCanvas(pageNumber, viewport, canvas, ratio) {
		if(!this._map.has(pageNumber)) throw new Error(`renderCanvas: page ${pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		const transform = [ratio, 0, 0, ratio, 0, 0];
		await entry.page.render({
			canvasContext: canvas.getContext('2d'),
			viewport,
			transform
		}).promise
	}
	async renderTextLayer(pageNumber, viewport, el) {
		if(!this._map.has(pageNumber)) throw new Error(`renderTextLayer: page ${pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		const readableStream = entry.page.streamTextContent({
			includeMarkedContent: true,
			disableNormalization: true,
		});
		await renderTextLayer({
			container: el,
			textContentSource: readableStream,
			viewport,
		}).promise
	}
	async renderAnnotationLayer(pageNumber, viewport, el) {
		if(!this._map.has(pageNumber)) throw new Error(`renderAnnotationLayer: page ${pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		const options = {
			annotations: await entry.page.getAnnotations(),
			div: el,
			linkService: this._linkService,
			page: entry.page,
			renderInteractiveForms: false,
			viewport: viewport/*.clone({
				dontFlip: true,
			})*/,
			imageResourcesPath: this._imageResourcesPath,
		};
		const anno = new AnnotationLayer(options);
		anno.render(options);
	}
}

export { PageCache }