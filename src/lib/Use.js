const pdfjsDistSymbol = Symbol();
const pdfjsViewerSymbol = Symbol();

/**
 * Configure PDFJS for your application.
 * @param {App} app Vue application instance.
 * @param {{pdfjs: Module, viewer: Module, workerSrc: String|URL|undefined}} options Options.
 * @param options.pdfjs The PDFJS module.
 * @param options.viewer The WEB module.
 * @param options.workerSrc The PDFJS worker or UNDEFINED if you set it.
 */
function usePdfjs(app, { pdfjs, viewer, workerSrc }) {
	if(!pdfjs) throw new Error("PDFJS is not defined");
	if(!viewer) throw new Error("VIEWER is not defined");

	if(workerSrc) {
		pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
	}

	app.provide(pdfjsDistSymbol, pdfjs);
	app.provide(pdfjsViewerSymbol, viewer);
}

export { pdfjsDistSymbol, pdfjsViewerSymbol, usePdfjs }