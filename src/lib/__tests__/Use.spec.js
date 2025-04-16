import { describe, it, expect } from 'vitest'
import { usePdfjs, pdfjsDistSymbol, pdfjsViewerSymbol } from "../Use";
import { pdfjs, viewer } from "./PdfjsMock";

const make_app = () => {
	const app = {
		pmap: new Map(),
		use(func, options) {
			func(app, options);
		},
		provide(symbol, obj) {
			this.pmap.set(symbol, obj);
		}
	};
	return app;
}

describe("Use", () => {
	it("app.use fails undefined options", async () => {
		const app = make_app();
		const options = undefined;
		expect(
			() => { app.use(usePdfjs, options); }
		)
		.toThrow(new TypeError("Cannot destructure property 'pdfjs' of 'undefined' as it is undefined."));
	})
	it("app.use fails empty options", () => {
		const app = make_app();
		const options = {};
		expect(
			() => { app.use(usePdfjs, options); }
		)
		.toThrow(new Error("PDFJS is not defined"));
	})
	it("app.use no viewer no workerSrc", () => {
		const app = make_app();
		const options = {
			pdfjs: pdfjs
		};
		app.use(usePdfjs, options);
		expect(app.pmap.has(pdfjsDistSymbol)).toBe(true);
		expect(app.pmap.has(pdfjsViewerSymbol)).toBe(true);
		expect(app.pmap.get(pdfjsDistSymbol)).toBe(pdfjs);
		expect(app.pmap.get(pdfjsViewerSymbol)).toBe(undefined);
		expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe(undefined);
	})
	it("app.use viewer no workerSrc", () => {
		const app = make_app();
		const options = {
			pdfjs: pdfjs,
			viewer: viewer
		};
		app.use(usePdfjs, options);
		expect(app.pmap.has(pdfjsDistSymbol)).toBe(true);
		expect(app.pmap.has(pdfjsViewerSymbol)).toBe(true);
		expect(app.pmap.get(pdfjsDistSymbol)).toBe(pdfjs);
		expect(app.pmap.get(pdfjsViewerSymbol)).toBe(viewer);
		expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe(undefined);
	})
	it("app.use no viewer workerSrc", () => {
		const app = make_app();
		const options = {
			pdfjs: pdfjs,
			workerSrc: "workerSrc"
		};
		app.use(usePdfjs, options);
		expect(app.pmap.has(pdfjsDistSymbol)).toBe(true);
		expect(app.pmap.has(pdfjsViewerSymbol)).toBe(true);
		expect(app.pmap.get(pdfjsDistSymbol)).toBe(pdfjs);
		expect(app.pmap.get(pdfjsViewerSymbol)).toBe(undefined);
		expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe("workerSrc");
	})
	it("app.use all options", () => {
		const app = make_app();
		const options = {
			pdfjs: pdfjs,
			viewer: viewer,
			workerSrc: "workerSrc"
		};
		app.use(usePdfjs, options);
		expect(app.pmap.has(pdfjsDistSymbol)).toBe(true);
		expect(app.pmap.has(pdfjsViewerSymbol)).toBe(true);
		expect(app.pmap.get(pdfjsDistSymbol)).toBe(pdfjs);
		expect(app.pmap.get(pdfjsViewerSymbol)).toBe(viewer);
		expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe("workerSrc");
	})
})