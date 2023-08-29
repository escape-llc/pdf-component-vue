import { describe, it, expect } from 'vitest'
import * as tiles from '../Tiles'

describe("tiles", () => {
	it("finite", () => {
		const seq = tiles.finite(3);
		for(let ix = 0; ix < 3; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toBe(ix);
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(true);
		expect(vx2.value).toBe(undefined);
});
	it("infinite", () => {
		const seq = tiles.infinite();
		for(let ix = 0; ix < 30; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toBe(ix);
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(false);
		expect(vx2.value).toBe(30);
	});
	it("grid(i,j)", () => {
		const rows = tiles.finite(3);
		const seq = tiles.grid(rows, () => tiles.finite(3), (maj,min)=>{return {row:maj,column:min}; });
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({row: Math.floor(ix/3), column: ix % 3});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(true);
		expect(vx2.value).toBe(undefined);
	});
	it("rowMajor(i,j)", () => {
		const rows = tiles.finite(3);
		const seq = tiles.rowMajor(rows, () => tiles.finite(3));
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({row: Math.floor(ix/3), column: ix % 3});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(true);
		expect(vx2.value).toBe(undefined);
	});
	it("rowMajor(auto,1)", () => {
		const rows = tiles.infinite();
		const seq = tiles.rowMajor(rows, () => tiles.finite(1));
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({row: ix, column: 0});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(false);
		expect(vx2.value).toStrictEqual({ row: 9, column: 0 });
	});
	it("columnMajor(i,j)", () => {
		const cols = tiles.finite(3);
		const seq = tiles.columnMajor(() => tiles.finite(3), cols);
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({column: Math.floor(ix/3), row: ix % 3});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(true);
		expect(vx2.value).toBe(undefined);
	});
	it("columnMajor(i,auto)", () => {
		const cols = tiles.infinite();
		const seq = tiles.columnMajor(() => tiles.finite(1), cols);
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({row: 0, column: ix});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(false);
		expect(vx2.value).toStrictEqual({ row: 0, column: 9 });
	});
});