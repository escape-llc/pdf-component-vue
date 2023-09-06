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
	it("for/of", () => {
		const seq = tiles.finite(3);
		let ix = 0;
		for(const vx of seq) {
			expect(vx).toBe(ix);
			ix++;
		};
		expect(ix).toBe(3);
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
describe("TileConfiguration", () => {
	it("(row,3,3)", ()=> {
		const tc = new tiles.TileConfiguration(tiles.ROW, 3, 3);
		const seq = tc.sequence();
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({row: Math.floor(ix/3), column: ix % 3});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(true);
		expect(vx2.value).toBe(undefined);
	});
	it("(column,3,3)", ()=> {
		const tc = new tiles.TileConfiguration(tiles.COLUMN, 3, 3);
		const seq = tc.sequence();
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({column: Math.floor(ix/3), row: ix % 3});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(true);
		expect(vx2.value).toBe(undefined);
	});
	it("(row,auto,1)", () => {
		const tc = new tiles.TileConfiguration(tiles.ROW, NaN, 1);
		const seq = tc.sequence();
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({row: ix, column: 0});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(false);
		expect(vx2.value).toStrictEqual({ row: 9, column: 0 });
	});
	it("(column,1,auto)", () => {
		const tc = new tiles.TileConfiguration(tiles.COLUMN, 1, NaN);
		const seq = tc.sequence();
		for(let ix = 0; ix < 9; ix++) {
			const vx = seq.next();
			expect(vx.done).toBe(false);
			expect(vx.value).toStrictEqual({row: 0, column: ix});
		}
		const vx2 = seq.next();
		expect(vx2.done).toBe(false);
		expect(vx2.value).toStrictEqual({ row: 0, column: 9 });
	});
	it("total", () => {
		let tc = new tiles.TileConfiguration(tiles.COLUMN, 1, NaN);
		expect(tc.total).toBe(NaN);
		tc = new tiles.TileConfiguration(tiles.ROW, NaN, 1);
		expect(tc.total).toBe(NaN);
		tc = new tiles.TileConfiguration(tiles.COLUMN, 3, 3);
		expect(tc.total).toBe(9);
	});
	it("error (column,auto,1)", () => {
		expect(
			()=> { const tc = new tiles.TileConfiguration(tiles.COLUMN, NaN, 1); }
		)
		.toThrow(new Error("TileConfiguration.COLUMN: rows is NaN; must be a number"));
	});
	it("error (row,1,auto)", () => {
		expect(
			()=> { const tc = new tiles.TileConfiguration(tiles.ROW, 1, NaN); }
		)
		.toThrow(new Error("TileConfiguration.ROW: columns is NaN; must be a number"));
	});
	it("error (?,auto,auto)", () => {
		expect(
			()=> { const tc = new tiles.TileConfiguration(tiles.ROW, NaN, NaN); }
		)
		.toThrow(new Error("TileConfiguration: both rows and columns are NaN"));
		expect(
			()=> { const tc = new tiles.TileConfiguration(tiles.COLUMN, NaN, NaN); }
		)
		.toThrow(new Error("TileConfiguration: both rows and columns are NaN"));
	});
	it("error (invalid,?,?)", () => {
		expect(
			()=> { const tc = new tiles.TileConfiguration("bogus", 1, 1); }
		)
		.toThrow(new Error("TileConfiguration: 'bogus' unrecognized direction"));
	});
});