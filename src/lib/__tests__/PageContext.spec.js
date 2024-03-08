import { vi, describe, it, expect } from "vitest"
import { flushPromises } from '@vue/test-utils'

import * as pc from "../PageContext"
import * as dh from "../DocumentHandler"
import { PageCache } from "../PageCache"
import { pdfjs } from "./PdfjsMock";

vi.useFakeTimers();

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
describe("pageZone", () => {
	it("cp=1 hot=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = 0;
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			const zone = pc.pageZone(page, current, pagecount, hot, warm);
			expect(zone).toBe(expecting[page]);
		}
	});
	it("cp=15 hot=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = pagecount - 1;
		const expecting = [
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
		];
		for(let page = 0; page < pagecount; page++) {
			const zone = pc.pageZone(page, current, pagecount, hot, warm);
			expect(zone).toBe(expecting[page]);
		}
	});
	it("cp 1 hot=4 warm=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = 4;
		const current = 0;
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.COLD,
			pc.COLD,pc.COLD,pc.COLD,pc.COLD,pc.COLD,
		];
		for(let page = 0; page < pagecount; page++) {
			const zone = pc.pageZone(page, current, pagecount, hot, warm);
			expect(zone).toBe(expecting[page]);
		}
	});
	it("cp=9 hot=4 warm=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = 4;
		const current = 9;
		const expecting = [
			pc.COLD, pc.WARM, pc.WARM, pc.WARM, pc.WARM,
			pc.HOT ,pc.HOT ,pc.HOT ,pc.HOT ,pc.HOT,
			pc.HOT ,pc.HOT ,pc.HOT ,pc.HOT ,pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			const zone = pc.pageZone(page, current, pagecount, hot, warm);
			expect(zone).toBe(expecting[page]);
		}
	});
	it("cp=9 hot=undefined warm=undefined", () => {
		const pagecount = 15;
		const hot = undefined;
		const warm = undefined;
		const current = 9;
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.HOT ,pc.HOT ,pc.HOT ,pc.HOT ,pc.HOT,
			pc.HOT ,pc.HOT ,pc.HOT ,pc.HOT ,pc.HOT,
		];
		for(let page = 0; page < pagecount; page++) {
			const zone = pc.pageZone(page, current, pagecount, hot, warm);
			expect(zone).toBe(expecting[page]);
		}
	});
})
describe('PageContext', () => {
	it('initial state', () => {
		const page = new pc.PageContext(pc.CANVAS, pc.WIDTH, "page-1", 0, 1, "1");
		expect(page.id).toBe("page-1");
		expect(page.index).toBe(0);
		expect(page.pageNumber).toBe(1);
		expect(page.pageLabel).toBe("1");
		expect(page.state).toBe(pc.COLD);
		expect(page.is(pc.COLD)).toBe(true);
	});
	it("zones", () => {
		const page = new pc.PageContext(pc.CANVAS, pc.WIDTH, "page-1", 0, 1, "1");
		page.hot(0);
		expect(page.state).toBe(pc.HOT);
		expect(page.is(pc.HOT)).toBe(true);
		expect(page.didRender).toBe(false);
		expect(page.rotation).toBe(0);
		page.didRender = true;
		page.rotation = undefined;
		page.warm(90);
		expect(page.state).toBe(pc.WARM);
		expect(page.is(pc.WARM)).toBe(true);
		expect(page.didRender).toBe(false);
		expect(page.rotation).toBe(90);
		page.didRender = true;
		page.rotation = undefined;
		page.cold();
		expect(page.state).toBe(pc.COLD);
		expect(page.is(pc.COLD)).toBe(true);
		expect(page.didRender).toBe(false);
		expect(page.rotation).toBe(undefined);
	});
	it("grid", () => {
		const page = new pc.PageContext(pc.CANVAS, pc.WIDTH, "page-1", 0, 1, "1");
		page.grid(1,1);
		expect(page.gridRow).toBe(1);
		expect(page.gridColumn).toBe(1);
	});
	it("mount*", () => {
		const page = new pc.PageContext(pc.CANVAS, pc.WIDTH, "page-1", 0, 1, "1");
		const el = {};
		expect(page.container).toBe(null);
		expect(page.canvas).toBe(null);
		expect(page.divAnno).toBe(null);
		expect(page.divText).toBe(null);
		page.mountAnnotationLayer(el);
		expect(page.divAnno).toStrictEqual(el);
		page.mountTextLayer(el);
		expect(page.divText).toStrictEqual(el);
		page.mountCanvas(el);
		expect(page.canvas).toStrictEqual(el);
		page.mountContainer(el);
		expect(page.container).toStrictEqual(el);
		page.didRender = true;
		page.mountContainer(null);
		expect(page.container).toStrictEqual(null);
		expect(page.didRender).toBe(false);
	});
	/**
	 * Render now requires the "promise/timer" incantation, because it uses
	 * promises and requestAnimationFrame().
	 */
	it("render", async () => {
		const page = new pc.PageContext(pc.CANVAS, pc.WIDTH, "page-1", 0, 1, "1");
		const viewport = {
			scale: 1,
			width: 780,
			height: 960,
		};
		const container = {
			clientWidth: 1000,
			clientHeight: 1000,
			getBoundingClientRect: ()=> ({ width: 1000, height: 1000 }),
			style: {
				setProperty(name, value) {
					if(name === "--scale-factor") {
						expect(value).toBe(viewport.scale.toFixed(4));
					}
					else if(name === "--viewport-width") {
						expect(value).toBe(Math.floor(viewport.width));
					}
					else if(name === "--viewport-height") {
						expect(value).toBe(Math.floor(viewport.height));
					}
				}
			}
		};
		const canvas = {
			reset() { this.width = undefined; this.height = undefined },
			width: undefined,
			height: undefined,
			getContext(xx) {
				return {
					drawImage: (canvas, left, top) => { }
				};
			}
		};
		const divText = {
			called: false,
			reset() { this.called = false; },
			replaceChildren(...children) { this.called = true; },
			setAttribute(attr, value) { },
			getAttribute(attr) { return "position: relative"; },
		};
		const divAnno = {
			called: false,
			reset() { this.called = false; },
			replaceChildren(...children) { this.called = true; },
			setAttribute(attr, value) { },
			getAttribute(attr) { return "position: relative"; },
		};
		const cache = {
			called: false,
			reset() { this.called = false; },
			dimensions(pageNumber) {
				return { width: 612, height: 792 };
			},
			viewport(pageNumber, sizeMode, width, height, rotation, scale) {
				expect(pageNumber).toBe(page.pageNumber);
				if(sizeMode === page.sizeMode) {
					expect([pc.WIDTH, pc.HEIGHT]).toContain(sizeMode);
					expect(width).toBe(container.clientWidth);
					expect(height).toBe(container.clientHeight);
					// gets passed but ignored
					expect([undefined, 1]).toContain(scale);
				}
				else {
					expect(sizeMode).toBe(pc.SCALE);
					expect(width).toBe(undefined);
					expect(height).toBe(undefined);
					expect(scale).toBe(1);
				}
				expect(rotation).toBe(0);
				return viewport;
			},
			renderCanvas() { this.called = true; },
			renderTextLayer(pageNumber, viewport, el) {
				expect(pageNumber).toBe(page.pageNumber);
				expect(el).not.toBe(divText);
			},
			renderAnnotationLayer(pageNumber, viewport, el) {
				expect(pageNumber).toBe(page.pageNumber);
				expect(el).not.toBe(divAnno);
			},
		};
		page.mountTextLayer(divText);
		page.mountAnnotationLayer(divAnno);
		page.mountCanvas(canvas);
		page.mountContainer(container);
		page.hot(0);
		expect(page.didRender).toBe(false);
		expect(page.state).toBe(pc.HOT);
		await page.render(cache);
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(page.didRender).toBe(true);
		expect(page.scaleFactor).toBe(1);
		expect(canvas.width).toBe(viewport.width);
		expect(canvas.height).toBe(viewport.height);
		expect(divAnno.called).toBe(true);
		expect(divText.called).toBe(true);
		expect(cache.called).toBe(true);
		cache.reset();
		canvas.reset();
		divAnno.reset();
		divText.reset();
		// warm pages also set the flag
		page.warm(0);
		// warm pages have no extra layer divs
		// VUE would call these during template processing in the component
		page.mountTextLayer(null);
		page.mountAnnotationLayer(null);
		expect(page.state).toBe(pc.WARM);
		expect(page.didRender).toBe(false);
		await page.render(cache);
		await flushPromises();
		vi.runAllTimers();
		await flushPromises();
		expect(page.didRender).toBe(true);
		expect(page.scaleFactor).toBe(1);
		expect(canvas.width).toBe(viewport.width);
		expect(canvas.height).toBe(viewport.height);
		expect(divAnno.called).toBe(false);
		expect(divText.called).toBe(false);
		expect(cache.called).toBe(false);
	});
	it("materialize pages", () => {
		const list = [];
		pc.materializePages(pc.CANVAS, pc.WIDTH, "pdf", 5, list);
		expect(list.length).toBe(5);
		function verify(lx, ix) {
			expect(lx.id).toBe(`pdf-page-${lx.pageNumber}`);
			expect(lx.index).toBe(ix);
			expect(lx.pageNumber).toBe(ix + 1);
			expect(lx.pageLabel).toBe((ix + 1).toString());
			expect(lx.state).toBe(pc.COLD);
		}
		verify(list[0], 0);
		verify(list[1], 1);
		verify(list[2], 2);
		verify(list[3], 3);
		verify(list[4], 4);
	});
})
describe("DocumentHandler", async () => {
	it("DocumentHandler should throw for everything", () => {
		const ddh = new dh.DocumentHandler();
		expect(ddh.document).toBe(undefined);
		expect(async () => { const xxx = await ddh.load("source"); }).rejects.toThrowError("load: not implemented");
		expect(async () => { const xxx = await ddh.page(1); }).rejects.toThrowError("page: not implemented");
		expect(async () => { const xxx = await ddh.pageLabels(); }).rejects.toThrowError("pageLabels: not implemented");
		ddh.destroy();
		// does nothing so it should still be undefined
		expect(ddh.document).toBe(undefined);
	})
	it("DocumentHandler_pdfjs should throw if not load()", () => {
		const ddh = new dh.DocumentHandler_pdfjs(null, pdfjs);
		expect(ddh.document).toBe(null);
		expect(async () => { const xxx = await ddh.load(undefined); }).rejects.toThrowError("load: source was null or undefined");
		expect(async () => { const xxx = await ddh.page(1); }).rejects.toThrowError("page: load was not called");
		expect(async () => { const xxx = await ddh.pageLabels(); }).rejects.toThrowError("pageLabels: load was not called");
		ddh.destroy();
		expect(ddh.document).toBe(null);
	})
})
describe("PageCache", () => {
	it("evicted page should fail", () => {
		const cache = new PageCache(null, null, pdfjs);
		expect(() => { const xxx = cache.viewport(99, undefined); }).toThrowError("viewport: page 99 not in cache");
		expect(async () => { const xxx = await cache.renderCanvas(99, undefined); }).rejects.toThrowError("renderCanvas: page 99 not in cache");
		expect(async () => { const xxx = await cache.renderTextLayer(99, undefined); }).rejects.toThrowError("renderTextLayer: page 99 not in cache");
		expect(async () => { const xxx = await cache.renderAnnotationLayer(99, undefined); }).rejects.toThrowError("renderAnnotationLayer: page 99 not in cache");
		cache.retain(99, {
			rotation: 0,
			view: [0,0,680,790],
		});
		expect(cache.has(99)).toBe(true);
		expect(() => { const xxx = cache.viewport(99, 999); }).toThrowError("scaleFor: 999: unknown mode");
		cache.evict(99);
		expect(cache.has(99)).toBe(false);
	});
})
