import { describe, it, expect } from 'vitest'

import * as pc from '../PageContext.js'
import * as pm from "../PageManagement.js"

describe("PageManagement", () => {
	it("scan cp=0 hot=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = 0;
		const list = [];
		pc.materializePages(pc.WIDTH, "pdf", pagecount, list);
		const state = new pm.PageManagement_UpdateCache(current, hot, warm);
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
	});
	it("tiles cp=0 hot=4 tilect=undefined", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = 0;
		const tilect = undefined;
		const list = [];
		pc.materializePages(pc.WIDTH, "pdf", pagecount, list);
		const state = new pm.PageManagement_UpdateCache(current, hot, warm);
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
	});
	it("tiles cp=0 hot=4 tilect=4", () => {
		const pagecount = 15;
		const hot = 4;
		const warm = undefined;
		const current = 0;
		const tilect = 4;
		const list = [];
		pc.materializePages(pc.WIDTH, "pdf", pagecount, list);
		expect(list.length).toBe(pagecount);
		const state = new pm.PageManagement_UpdateCache(current, hot, warm);
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
	});
});