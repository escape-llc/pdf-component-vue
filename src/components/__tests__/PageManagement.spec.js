import { describe, it, expect } from "vitest"

import * as pc from "../PageContext.js"
import * as pm from "../PageManagement.js"
import * as sc from "../ScrollConfiguration.js"

describe("PageManagement_UpdateZones", () => {
	it("default impl", () => {
		const pmx = new pm.PageManagement();
		expect(pmx.tileStart).toBe(0);
		const xx = pmx.execute([]);
		expect(xx).toBe(undefined);
	})
	it("invalid pageIndex", () => {
		expect(() => new pm.PageManagement_UpdateZones(-1, undefined, undefined))
		.toThrow(new Error("pageIndex: must be GE zero"));
		expect(() => new pm.PageManagement_UpdateZones(undefined, undefined, undefined))
		.toThrow(new Error("pageIndex: must be GE zero"));
	})
	it("invalid hotZone", () => {
		expect(() => new pm.PageManagement_UpdateZones(0, -1, undefined))
		.toThrow(new Error("hotZone: must be undefined or GE zero"));
	})
	it("invalid warmZone", () => {
		expect(() => new pm.PageManagement_UpdateZones(0, undefined, -1))
		.toThrow(new Error("warmZone: must be undefined or GE zero"));
	})
	it("scan cp=0 hot=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = 0;
		const list = [];
		pc.materializePages(pc.CANVAS, pc.WIDTH, "pdf", pagecount, list);
		const state = new pm.PageManagement_UpdateZones(current, hot, warm);
		const output = state.execute(list);
		expect(output.length).toBe(pagecount);
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			expect(output[page].page.index).toBe(page);
			expect(output[page].zone).toBe(expecting[page]);
		}
	})
	it("tiles cp=0 hot=4 tilect=undefined", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = 0;
		const tilect = undefined;
		const list = [];
		pc.materializePages(pc.CANVAS, pc.WIDTH, "pdf", pagecount, list);
		const state = new pm.PageManagement_UpdateZones(current, hot, warm);
		const output = state.execute(list);
		expect(output.length).toBe(pagecount);
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			expect(output[page].page.index).toBe(page);
			expect(output[page].zone).toBe(expecting[page]);
		}
		const tiles = pm.tiles(output, 0, tilect);
		expect(tiles.length).toBe(output.length);
	})
	it("tiles cp=0 hot=4 tilect=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = 0;
		const tilect = 4;
		const list = [];
		pc.materializePages(pc.CANVAS, pc.WIDTH, "pdf", pagecount, list);
		expect(list.length).toBe(pagecount);
		const state = new pm.PageManagement_UpdateZones(current, hot, warm);
		const output = state.execute(list);
		expect(output.length).toBe(pagecount);
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			expect(output[page].page.state).toBe(pc.COLD);
			expect(output[page].page.index).toBe(page);
			expect(output[page].zone).toBe(expecting[page]);
		}
		const tiles = pm.tiles(output, 0, tilect);
		expect(tiles.length).toBe(tilect);
	})
})
describe("PageManagement_UpdateRange", () => {
	it("invalid start", () => {
		expect(() => new pm.PageManagement_UpdateRange(-1, undefined))
		.toThrow(new Error("start: must be GE zero"));
	})
	it("invalid stop", () => {
		expect(() => new pm.PageManagement_UpdateRange(0, -1))
		.toThrow(new Error("stop: must be GE zero"));
		expect(() => new pm.PageManagement_UpdateRange(3, 0))
		.toThrow(new Error("stop: must be GE start"));
	})
	it("scan start=0 stop=7", () => {
		const pagecount = 15;
		const start = 0;
		const stop = 7;
		const list = [];
		pc.materializePages(pc.CANVAS, pc.WIDTH, "pdf", pagecount, list);
		const state = new pm.PageManagement_UpdateRange(start, stop);
		expect(state.tileStart).toBe(0);
		const output = state.execute(list);
		expect(output.length).toBe(pagecount);
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.HOT, pc.HOT, pc.HOT, pc.WARM,pc.WARM,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			expect(output[page].page.index).toBe(page);
			expect(output[page].zone).toBe(expecting[page]);
		}
	})
	it("scan start=0 stop=7, start=8 stop=10", () => {
		const pagecount = 15;
		const start = 0;
		const stop = 7;
		const list = [];
		pc.materializePages(pc.CANVAS, pc.WIDTH, "pdf", pagecount, list);
		const state = new pm.PageManagement_UpdateRange(start, stop);
		const output = state.execute(list);
		expect(output.length).toBe(pagecount);
		const expecting = [
			pc.HOT, pc.HOT, pc.HOT, pc.HOT, pc.HOT,
			pc.HOT, pc.HOT, pc.HOT, pc.WARM,pc.WARM,
			pc.WARM,pc.WARM,pc.WARM,pc.WARM,pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			expect(output[page].page.index).toBe(page);
			expect(output[page].zone).toBe(expecting[page]);
		}
		// apply state updates
		output.forEach(ox => { ox.page.state = ox.zone; });
		// move the HOT window
		const start2 = 8;
		const stop2 = 10;
		const state2 = new pm.PageManagement_UpdateRange(start2, stop2);
		const output2 = state2.execute(list);
		expect(output2.length).toBe(pagecount);
		// previously HOT pages turn WARM, previously COLD pages remain COLD
		const expecting2 = [
			pc.WARM, pc.WARM, pc.WARM, pc.WARM, pc.WARM,
			pc.WARM, pc.WARM, pc.WARM, pc.HOT,  pc.HOT,
			pc.HOT,  pc.WARM, pc.WARM, pc.WARM, pc.WARM,
		];
		for(let page = 0; page < pagecount; page++) {
			expect(output2[page].page.index).toBe(page);
			expect(output2[page].zone).toBe(expecting2[page]);
		}
	})
})
describe("PageManagement_Scroll", () => {
	it("invalid pageIndex", () => {
		expect(() => new pm.PageManagement_Scroll(-1, undefined))
		.toThrow(new Error("pageIndex: must be GE zero"));
	})
	it("invalid pm", () => {
		expect(() => new pm.PageManagement_Scroll(0, undefined))
		.toThrow(new Error("pm: MUST be an instance of PageManagement"));
		expect(() => new pm.PageManagement_Scroll(0, new sc.ScrollConfiguration()))
		.toThrow(new Error("pm: MUST be an instance of PageManagement"));
	})
	it("valid", () => {
		expect(() => new pm.PageManagement_Scroll(-1, new pm.PageManagement_UpdateZones(0)))
		.toThrow(new Error("pageIndex: must be GE zero"));
	})
})
describe("ScrollConfiguration", () => {
	it("ctor", () => {
		const margin = "0px 0px 0px 0px";
		const cfg = new sc.ScrollConfiguration(document.createElement("div"), margin);
		expect(cfg.root instanceof HTMLDivElement).toBe(true);
		expect(cfg.rootMargin).toBe(margin);
	})
})