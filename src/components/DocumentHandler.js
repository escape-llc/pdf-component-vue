import * as pdf from 'pdfjs-dist/build/pdf.js'

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

export {
	DocumentHandler, DocumentHandler_pdfjs
}