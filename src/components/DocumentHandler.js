import { getDocument, PasswordResponses } from "pdfjs-dist/build/pdf.min.js"

/**
 * Base class for handlers.  Provides level of abstraction from PDFJS.
 */
class DocumentHandler {
	get document() { return undefined; }
	async load(source) {
		throw new Error("load: not implemented");
	}
	async page(pageNum) {
		throw new Error("page: not implemented");
	}
	async pageLabels() {
		throw new Error("pageLabels: not implemented");
	}
	destroy() {}
}
/**
 * DocumentHandler bound to the PDFJS document/page objects.
 */
class DocumentHandler_pdfjs extends DocumentHandler {
	#document = null
	#emit
	constructor(emitter) {
		super();
		this.#emit = emitter;
	}
	get document() { return this.#document; }
	destroy() {
		this.#document?.destroy();
		this.#document = null;
	}
	/**
	 * Handle the loading process, including emitting events related to PDFJS.
	 * @param {String|Object|URL|Uint8Array} source document source.
	 * @returns PDFDocumentProxy.
	 */
	async load(source) {
		if(!source) throw new Error("load: source was null or undefined");
		this.destroy();
		if (source._pdfInfo) {
			this.#document = source;
		} else {
			const documentLoadingTask = getDocument(source);
			documentLoadingTask.onProgress = (progressParams) => {
				this.#emit("progress", progressParams);
			}
			documentLoadingTask.onPassword = (callback, reason) => {
				const retry = reason === PasswordResponses.INCORRECT_PASSWORD;
				this.#emit("password-requested", callback, retry);
			}
			this.#document = await documentLoadingTask.promise;
		}
		return this.#document;
	}
	/**
	 * Query the document for the (optional) list of page labels.
	 * @returns Array of page labels.
	 */
	async pageLabels() {
		if(!this.#document) throw new Error("pageLabels: load was not called");
		const labels = await this.#document.getPageLabels();
		return labels;
	}
	/**
	 * Load the requested page from document.
	 * @param {Number} pageNum 1-relative page number.
	 * @returns PDFPageProxy
	 */
	async page(pageNum) {
		if(!this.#document) throw new Error("page: load was not called");
		return await this.#document.getPage(pageNum);
	}
}

export {
	DocumentHandler, DocumentHandler_pdfjs
}