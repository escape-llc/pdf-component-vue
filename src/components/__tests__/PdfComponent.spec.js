import { vi, describe, it, expect } from 'vitest'

import { mount, flushPromises } from '@vue/test-utils'
import PdfComponent from '../PdfComponent.vue'
import * as tiles from "../Tiles"
import * as pm from "../PageManagement"

function mountedPromise(options) {
	return new Promise((resolve, reject) => {
			const wrapper = mount(PdfComponent, {
				props: {
					...options,
					onLoaded: () => {
						resolve(wrapper);
					},
					"onLoading-failed": e => {
						reject(e);
					}
				}
		});
	});
}

const PAGE_WIDTH = 680;
const PAGE_HEIGHT = 890;
const PAGE_COUNT = 6;

HTMLCanvasElement.prototype.getContext = () => {}
vi.mock('pdfjs-dist/build/pdf.worker.js', () => vi.fn())
vi.mock('pdfjs-dist/build/pdf.js', () => ({
	GlobalWorkerOptions: {
		workerSrc: undefined
	},
	getDocument: () => ({
		promise: Promise.resolve({
			numPages: PAGE_COUNT,
			getPageLabels: () => Promise.resolve(["Cover","i","ii","1","2","3"]),
			getPage: (pageNumber) => Promise.resolve({
				view: [0,0,PAGE_WIDTH,PAGE_HEIGHT],
				getViewport: () => ({
					width: PAGE_WIDTH,
					height: PAGE_HEIGHT,
					scale: 1
				}),
				getAnnotations: () => Promise.resolve([]),
				render: () => ({
					promise: Promise.resolve({})
				}),
			}),
		}),
	}),
}))

describe('PdfComponent', () => {
	const PDF = "http://localhost:5173/tracemonkey.pdf";
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
				"onLoading-failed": e => {
					error = e;
				}
			}
		});
		await wrapper.setProps({source: PDF});
		await flushPromises();
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		expect(loading).toBe(true);
		expect(error).toBe(undefined);
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
	})
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
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(wrapper.emitted()).toHaveProperty("rendered");
		await wrapper.setProps({ pageManagement: new pm.PageManagement_Scroll(0, undefined, undefined) });
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(div.element.id).toBe('my-pdf');
		expect(div.element.classList.contains("document-container")).toBe(true);
		for(let ix = 1; ix <= PAGE_COUNT; ix++) {
			const div = wrapper.get(`#my-pdf-page-${ix}`);
			expect(div).not.toBe(undefined);
			expect(div.element.id).toBe(`my-pdf-page-${ix}`);
			//expect(div.element.classList.contains(`page-container-class-${ix}`)).toBe(false);
		}
	})
})
