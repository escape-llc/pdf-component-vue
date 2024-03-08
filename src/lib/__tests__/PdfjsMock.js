const PAGE_WIDTH = 680;
const PAGE_HEIGHT = 890;
const PAGE_COUNT = 6;

class SVGGraphics {
	constructor(o1, o2) {}
	getSVG(oplist, viewport) { return {}; }
}
const pdfjs = {
	GlobalWorkerOptions: {
		workerSrc: undefined
	},
	AnnotationLayer: function AnnotationLayer(options) {
		this.render = (options) => {};
	},
	// only present in 3.x
	SVGGraphics,
	renderTextLayer: (options) => ({ promise: Promise.resolve({}) }),
	getDocument: () => ({
		promise: Promise.resolve({
			numPages: PAGE_COUNT,
			destroy: () => {},
			getPageLabels: () => Promise.resolve(["Cover","i","ii","1","2","3"]),
			getPage: (pageNumber) => Promise.resolve({
				view: [0,0,PAGE_WIDTH,PAGE_HEIGHT],
				getViewport: () => ({
					width: PAGE_WIDTH,
					height: PAGE_HEIGHT,
					scale: 1,
					clone(options) {
						return {
							width: PAGE_WIDTH,
							height: PAGE_HEIGHT,
							scale: 1,
						};
					},
				}),
				streamTextContent: (options) => ({}),
				getAnnotations: () => Promise.resolve([]),
				render: () => ({
					promise: Promise.resolve({})
				}),
			}),
		}),
	}),
}
class PDFLinkService {
	setDocument(document) {}
	setViewer(options) {}
}
const viewer = {
	PDFLinkService,
}
export { pdfjs, viewer }