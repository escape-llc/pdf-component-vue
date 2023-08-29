import * as pdfjs from "pdfjs-dist/build/pdf.js";
import { WIDTH, HEIGHT } from "./PageContext";

/**
 * Isolate all the PDFJS specific page logic in one place.
 * This should hide the PDFJS page objects from the remainder of the application.
 */
class PageCache {
	#map = new Map();
	#linkService
	/**
	 * Ctor.
	 * @param {pdfjs.PDFLinkService} linkService Required for annotation rendering.
	 */
	constructor(linkService) {
		this.#linkService = linkService;
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
		this.#map.set(pageNumber, entry);
	}
	/**
	 * Instruct cache to discard this page and its statistics.
	 * @param {Number} pageNumber 1-relative page number.
	 */
	evict(pageNumber) {
		this.#map.delete(pageNumber);
	}
	/**
	 * Query the cache for the existence given page number.
	 * @param {Number} pageNumber 1-relative page number.
	 * @returns true: present; false: not present.
	 */
	has(pageNumber) {
		return this.#map.has(pageNumber);
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
		if(!this.#map.has(pageNumber)) throw new Error(`viewport: page {pageNumber} not in cache`);
		const entry = this.#map.get(pageNumber);
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
	/**
	 * Render the page image/text/annotation layer(s).
	 * @param {Number} pageNumber 1-relative page number.
	 * @param {pdfjs.PageViewport} viewport current viewport.
	 * @param {HTMLCanvasElement} canvas target canvas element.
	 * @param {HTMLDivElement} div1 !NULL: target text layer element.
	 * @param {HTMLDivElement} div2 !NULL: target annotation layer element.
	 */
	async render(pageNumber, viewport, canvas, div1, div2) {
		if(!this.#map.has(pageNumber)) throw new Error(`render: page ${pageNumber} not in cache`);
		const entry = this.#map.get(pageNumber);
		await entry.page.render({
			canvasContext: canvas.getContext('2d'),
			viewport,
		}).promise
		if(div1) {
			const readableStream = entry.page.streamTextContent({
				includeMarkedContent: true,
				disableNormalization: true,
			});
			await pdfjs.renderTextLayer({
				container: div1,
				textContentSource: readableStream,
				viewport,
			}).promise
		}
		if(div2) {
			const options = {
				annotations: await entry.page.getAnnotations(),
				div: div2,
				linkService: this.#linkService,
				page: entry.page,
				renderInteractiveForms: false,
				viewport: viewport/*.clone({
					dontFlip: true,
				})*/,
				//imageResourcesPath: this.imageResourcesPath,
			};
			const anno = new pdfjs.AnnotationLayer(options);
			anno.render(options);
		}
	}
}

export { PageCache }