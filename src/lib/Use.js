const pdfjsDistSymbol = Symbol();
const pdfjsViewerSymbol = Symbol();

/**
 * Configure PDFJS for your application.
 * @param {App} app Vue application instance.
 * @param {{pdfjs: Module, viewer: Module|undefined, workerSrc: String|URL|undefined}} options Options.
 * @param options.pdfjs The PDFJS module.
 * @param options.viewer The WEB module or UNDEFINED to opt-out.  Opting out disables the Annotation Layer.
 * @param options.workerSrc The PDFJS worker or UNDEFINED if you set it.
 */
function usePdfjs(app, { pdfjs, viewer, workerSrc }) {
	if(!pdfjs) throw new Error("PDFJS is not defined");

	if(workerSrc) {
		pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
	}

	app.provide(pdfjsDistSymbol, pdfjs);
	app.provide(pdfjsViewerSymbol, viewer);
}

export { pdfjsDistSymbol, pdfjsViewerSymbol, usePdfjs }