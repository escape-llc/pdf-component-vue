import { describe, it, expect } from 'vitest'

import * as pc from '../PageContext.js'
import { PageCache } from '../PageCache.js';

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
});
describe('PageContext', () => {
	it('initial state', () => {
		const page = new pc.PageContext(pc.WIDTH, "page-1", 0, 1, "1");
		expect(page.id).toBe("page-1");
		expect(page.index).toBe(0);
		expect(page.pageNumber).toBe(1);
		expect(page.pageTitle).toBe("1");
		expect(page.state).toBe(pc.COLD);
		expect(page.is(pc.COLD)).toBe(true);
	});
	it("materialize pages", () => {
		const list = [];
		pc.materializePages(pc.WIDTH, "pdf", 5, list);
		expect(list.length).toBe(5);
		function verify(lx, ix) {
			expect(lx.id).toBe(`pdf-page-${lx.pageNumber}`);
			expect(lx.index).toBe(ix);
			expect(lx.pageNumber).toBe(ix + 1);
			expect(lx.pageTitle).toBe((ix + 1).toString());
			expect(lx.state).toBe(pc.COLD);
		}
		verify(list[0], 0);
		verify(list[1], 1);
		verify(list[2], 2);
		verify(list[3], 3);
		verify(list[4], 4);
	});
});
