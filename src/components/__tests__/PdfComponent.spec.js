import { vi, describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PdfComponent from '../PdfComponent.vue'
import * as tiles from "../Tiles"
import * as pm from "../PageManagement"
import * as cmd from "../Commands"
import { HEIGHT } from '../PageContext'

vi.useFakeTimers();

function mountedPromise(options) {
	return new Promise((resolve, reject) => {
			const wrapper = mount(PdfComponent, {
				props: {
					...options,
					onLoaded: () => {
						resolve(wrapper);
					},
					"onLoad-failed": e => {
						reject(e);
					}
				}
		});
	});
}
/**
 * This version throws the given error from the $emit(loaded).
 * NOTE: this generates Vue Warning in the console: Unhandled error during execution of component event handler.
 * However, the component DOES catch that error (it is NOT unhandled) and emit the correct event.
 * @param {any} options create options.
 * @param {*} ex the error to raise.
 * @returns new Promise<Wrapper,Error>.
 */
function mountedPromiseLoadedError(options, ex) {
	return new Promise((resolve, reject) => {
			const wrapper = mount(PdfComponent, {
				props: {
					...options,
					onLoaded: () => {
						// simulate an error in user's handler
						throw ex;
					},
					"onLoad-failed": ee => {
						resolve({ wrapper, ee });
					}
				}
		});
	});
}

const PDF = "http://localhost:5173/tracemonkey.pdf";
const PAGE_WIDTH = 680;
const PAGE_HEIGHT = 890;
const PAGE_COUNT = 6;

global.OffscreenCanvas = vi.fn().mockImplementation((width, height) => {
	return {
			height,
			width,
			oncontextlost: vi.fn(),
			oncontextrestored: vi.fn(),
			getContext: vi.fn(() => undefined),
			convertToBlob: vi.fn(),
			transferToImageBitmap: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
	};
});

HTMLCanvasElement.prototype.getContext = (ct) => ({
	drawImage: (canvas, left, top) => { }
})
vi.mock('pdfjs-dist/build/pdf.worker.min.js', () => vi.fn())
vi.mock('pdfjs-dist/build/pdf.min.js', () => ({
	GlobalWorkerOptions: {
		workerSrc: undefined
	},
	AnnotationLayer: function AnnotationLayer(options) {
		this.render = (options) => {};
	},
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
}))
/**
 * NOTE: in order to pump out all the rAF callbacks and Promises, requires extra machinations:
 * await flushPromises(), vi.runAllTimers(), await flushPromises()
 */
describe('PdfComponent', () => {
-	it('source.prop', async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			pageContainerClass: "page-container",
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			expect(div.element.classList.contains("page-container")).toBe(true);
			const style = div.attributes("style");
			expect(style).toContain("--scale-factor: 1");
			expect(style).toContain(`--viewport-width: ${PAGE_WIDTH}`);
			expect(style).toContain(`--viewport-height: ${PAGE_HEIGHT}`);
			// no grid-* without TileConfiguration
			const canvas = div.get("canvas");
			expect(canvas).not.toBe(undefined);
			expect(canvas.element.classList.contains("grid-stack")).toBe(true);
			expect(canvas.attributes("width")).toBe(PAGE_WIDTH.toString());
			expect(canvas.attributes("height")).toBe(PAGE_HEIGHT.toString());
		}
		wrapper.unmount();
	})
	it("source.load-failed", async () => {
		const ex = new Error("This is my error");
		const { wrapper, ee } = await mountedPromiseLoadedError({
			id: "my-pdf",
			class: "document-container",
			pageContainerClass: "page-container",
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		}, ex);
		expect(wrapper).not.toBe(undefined);
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("load-failed");
		expect(ee).toBe(ex);
	})
	it('source.watch', async () => {
		let loading = false;
		let error = undefined;
		// can't use a Promise here; no source given
		const wrapper = mount(PdfComponent, {
			props: {
				id: "my-pdf",
				class: "document-container",
				pageContainerClass: "page-container",
				canvasClass: "grid-stack",
				annotationLayerClass: "grid-stack",
				textLayerClass: "grid-stack",
				onLoaded: () => {
					loading = true;
				},
				"onLoad-failed": e => {
					error = e;
				}
			}
		});
		await wrapper.setProps({source: PDF});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		expect(loading).toBe(true);
		expect(error).toBe(undefined);
		wrapper.unmount();
	})
	it("TileConfiguration(ROW,2,3)", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			pageContainerClass: "page-container",
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		let row = 1, column = 1;
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			expect(div.element.classList.contains("page-container")).toBe(true);
			const style = div.attributes("style");
			expect(style).toContain("--scale-factor: 1");
			expect(style).toContain(`--viewport-width: ${PAGE_WIDTH}`);
			expect(style).toContain(`--viewport-height: ${PAGE_HEIGHT}`);
			expect(style).toContain(`grid-row: ${row}`);
			expect(style).toContain(`grid-column: ${column}`);
			const canvas = div.get("canvas");
			expect(canvas).not.toBe(undefined);
			expect(canvas.element.classList.contains("grid-stack")).toBe(true);
			expect(canvas.attributes("width")).toBe(PAGE_WIDTH.toString());
			expect(canvas.attributes("height")).toBe(PAGE_HEIGHT.toString());
			column++;
			if(column > 3) {
				row++;
				column = 1;
			}
		}
		wrapper.unmount();
	})
	it("CalculatePageClass", async () => {
		function pageContainerClass(px) {
			return `page-container-class-${px.pageNumber}`;
		}
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			pageContainerClass,
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			expect(div.element.classList.contains(`page-container-class-${ix}`)).toBe(true);
		}
		wrapper.unmount();
	})
	/*
	Flame test for Page Management.
	*/
	it("PageManagement.watch", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		await wrapper.setProps({ pageManagement: new pm.PageManagement_Scroll(1, new pm.PageManagement_UpdateZones(0, undefined, undefined)) });
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
		}
		wrapper.unmount();
	})
	/*
	This case tests the proper mounting/unmounting of DOM elements when pages change from HOT to WARM.
	This relies on the STATE property being reactive (conditional rendering in the template).
	*/
	it("PageManagement mount/unmount", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			textLayer: true,
			annotationLayer: true,
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			pageManagement: new pm.PageManagement_UpdateRange(0, 1),
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		function checkPage(div, ix) {
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			const state = div.element.getAttribute("data-state");
			if(state === "2") {
				// page canvas
				const canvas = div.get("canvas");
				expect(canvas).not.toBe(undefined);
				expect(canvas.element.classList.contains("grid-stack")).toBe(true);
				expect(canvas.attributes("width")).toBe(PAGE_WIDTH.toString());
				expect(canvas.attributes("height")).toBe(PAGE_HEIGHT.toString());
			}
			else {
				// placeholder div
				const phd = div.get("div > :first-child");
				expect(phd).not.toBe(undefined);
				expect(phd.element.classList.contains("grid-stack")).toBe(true);
				expect(phd.element.classList.contains("textLayer")).toBe(false);
				expect(phd.element.classList.contains("annotationLayer")).toBe(false);
			}
		}
		function checkTextLayer(div, ix) {
			const layer = div.get("div.textLayer");
			expect(layer).not.toBe(undefined);
			expect(layer.element.classList.contains("grid-stack")).toBe(true);
		}
		function checkNoTextLayer(div, ix) {
			const layer = div.find("div.textLayer");
			expect(layer.exists()).toBe(false);
		}
		function checkAnnoLayer(div, ix) {
			const layer = div.get("div.annotationLayer");
			expect(layer).not.toBe(undefined);
			expect(layer.element.classList.contains("grid-stack")).toBe(true);
		}
		function checkNoAnnoLayer(div, ix) {
			const layer = div.find("div.annotationLayer");
			expect(layer.exists()).toBe(false);
		}
		function checkPageLoop(p1, p2) {
			for(let ix = 0; ix < PAGE_COUNT; ix++) {
				const div = wrapper.get(`#my-pdf-page-${ix + 1}`);
				checkPage(div, ix + 1);
				if(ix == p1 || ix == p2) {
					checkTextLayer(div, ix);
					checkAnnoLayer(div, ix);
				}
				else {
					checkNoTextLayer(div, ix);
					checkNoAnnoLayer(div, ix);
				}
			}
		}
		async function updateRange(p1, p2) {
			await wrapper.setProps({ pageManagement: new pm.PageManagement_UpdateRange(p1, p2) });
			await flushPromises();
			checkPageLoop(p1, p2);
		}
		checkPageLoop(0, 1);
		await updateRange(2, 3);
		await updateRange(4, 5);
		wrapper.unmount();
	})
	it("HEIGHT mode", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			sizeMode: HEIGHT,
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		let row = 1, column = 1;
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			expect(div.element.classList.contains("page-container")).toBe(false);
			const style = div.attributes("style");
			expect(style).toContain("--scale-factor: 1");
			expect(style).toContain(`--viewport-width: ${PAGE_WIDTH}`);
			expect(style).toContain(`--viewport-height: ${PAGE_HEIGHT}`);
			expect(style).toContain(`grid-row: ${row}`);
			expect(style).toContain(`grid-column: ${column}`);
			const canvas = div.get("canvas");
			expect(canvas).not.toBe(undefined);
			expect(canvas.element.classList.contains("grid-stack")).toBe(true);
			expect(canvas.attributes("width")).toBe(PAGE_WIDTH.toString());
			expect(canvas.attributes("height")).toBe(PAGE_HEIGHT.toString());
			column++;
			if(column > 3) {
				row++;
				column = 1;
			}
		}
		wrapper.unmount();
	})
	/*
	Flame test for text layer.
	*/
	it("Text layer", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			sizeMode: HEIGHT,
			textLayer: true,
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		let row = 1, column = 1;
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			expect(div.element.classList.contains("page-container")).toBe(false);
			const style = div.attributes("style");
			expect(style).toContain("--scale-factor: 1");
			expect(style).toContain(`--viewport-width: ${PAGE_WIDTH}`);
			expect(style).toContain(`--viewport-height: ${PAGE_HEIGHT}`);
			expect(style).toContain(`grid-row: ${row}`);
			expect(style).toContain(`grid-column: ${column}`);
			const canvas = div.get("canvas");
			expect(canvas).not.toBe(undefined);
			expect(canvas.element.classList.contains("grid-stack")).toBe(true);
			expect(canvas.attributes("width")).toBe(PAGE_WIDTH.toString());
			expect(canvas.attributes("height")).toBe(PAGE_HEIGHT.toString());
			const textLayer = div.get("div.textLayer");
			expect(textLayer).not.toBe(undefined);
			column++;
			if(column > 3) {
				row++;
				column = 1;
			}
		}
		wrapper.unmount();
	})
	/*
	Flame test for annotation layer.
	*/
	it("Annotation Layer", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			sizeMode: HEIGHT,
			annotationLayer: true,
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		let row = 1, column = 1;
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			expect(div.element.classList.contains("page-container")).toBe(false);
			const style = div.attributes("style");
			expect(style).toContain("--scale-factor: 1");
			expect(style).toContain(`--viewport-width: ${PAGE_WIDTH}`);
			expect(style).toContain(`--viewport-height: ${PAGE_HEIGHT}`);
			expect(style).toContain(`grid-row: ${row}`);
			expect(style).toContain(`grid-column: ${column}`);
			const canvas = div.get("canvas");
			expect(canvas).not.toBe(undefined);
			expect(canvas.element.classList.contains("grid-stack")).toBe(true);
			expect(canvas.attributes("width")).toBe(PAGE_WIDTH.toString());
			expect(canvas.attributes("height")).toBe(PAGE_HEIGHT.toString());
			const textLayer = div.get("div.annotationLayer");
			expect(textLayer).not.toBe(undefined);
			column++;
			if(column > 3) {
				row++;
				column = 1;
			}
		}
		wrapper.unmount();
	})
	it("Page click", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			sizeMode: HEIGHT,
			annotationLayer: true,
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		const page = wrapper.get("#my-pdf-page-1");
		await page.trigger("click");
		expect(wrapper.emitted()).toHaveProperty("page-click");
	})
	it("scrollToPage", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			sizeMode: HEIGHT,
			annotationLayer: true,
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		const scroll = new cmd.ScrollToPage(2);
		// the JSDOM does not implement Element.scrollIntoView()
		// so this also tests the command failure path
		await wrapper.setProps({ commandPort: scroll });
		// order of these is important!
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("command-complete");
		const data = wrapper.emitted()["command-complete"][0];
		expect(data[0].command).toEqual(scroll);
		expect(data[0].ok).toBe(false);
		expect(data[0].result.message).toBe("el.scrollIntoView is not a function");
	})
	it("print", async () => {
		const wrapper = await mountedPromise({
			id: "my-pdf",
			class: "document-container",
			sizeMode: HEIGHT,
			annotationLayer: true,
			tileConfiguration: new tiles.TileConfiguration(tiles.ROW, 2, 3),
			canvasClass: "grid-stack",
			annotationLayerClass: "grid-stack",
			textLayerClass: "grid-stack",
			source: PDF
		});
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		const print = new cmd.PrintDocument();
		await wrapper.setProps({ commandPort: print });
		// order of these is important!
		vi.runAllTimers();
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("command-complete");
		const data = wrapper.emitted()["command-complete"][0];
		expect(data[0].command).toEqual(print);
		expect(data[0].ok).toBe(true);
	});
})
