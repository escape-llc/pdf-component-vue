import * as pdfjs from "pdfjs-dist/build/pdf.js";
import { WIDTH, HEIGHT } from "./PageContext";

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
	 * @param {pdfjs.PDFLinkService} linkService Required by annotation rendering.
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
	 * Compute the active viewport for the page and given parameters.
	 * @param {Number} pageNumber 1-relative page number.
	 * @param {Number} mode size mode WIDTH,HEIGHT.
	 * @param {Number} width container width.
	 * @param {Number} height container height.
	 * @param {Number} rotation document-level rotation.
	 * @returns new instance.
	 */
	viewport(pageNumber, mode, width, height, rotation) {
		if(!this._map.has(pageNumber)) throw new Error(`viewport: page {pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		const pageRotation = entry.rotation + rotation;
		switch(mode) {
			case WIDTH:
				const pageWidth = (pageRotation / 90) % 2 ? entry.height : entry.width;
				const scalew = width / pageWidth;
				// TODO can use pdf.PageViewport() that's what getViewport() returns
				const viewportw = entry.page.getViewport({ scale: scalew, rotation });
				return viewportw;
			case HEIGHT:
				const pageHeight = (pageRotation / 90) % 2 ? entry.width : entry.height;
				const scaleh = height / pageHeight;
				const viewporth = entry.page.getViewport({ scale: scaleh, rotation });
				return viewporth;
		}
		throw new Error(`viewport: ${mode}: unknown mode`);
	}
	async renderCanvas(pageNumber, viewport, canvas) {
		if(!this._map.has(pageNumber)) throw new Error(`renderCanvas: page ${pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		await entry.page.render({
			canvasContext: canvas.getContext('2d'),
			viewport,
		}).promise
	}
	async renderTextLayer(pageNumber, viewport, el) {
		if(!this._map.has(pageNumber)) throw new Error(`renderTextLayer: page ${pageNumber} not in cache`);
		const entry = this._map.get(pageNumber);
		const readableStream = entry.page.streamTextContent({
			includeMarkedContent: true,
			disableNormalization: true,
		});
		await pdfjs.renderTextLayer({
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
		const anno = new pdfjs.AnnotationLayer(options);
		anno.render(options);
	}
}

export { PageCache }