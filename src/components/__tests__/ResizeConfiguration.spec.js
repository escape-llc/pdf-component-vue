import { vi, describe, it, expect } from 'vitest'
import * as resize from "../ResizeConfiguration";

vi.useFakeTimers();

describe("ResizeConfiguration", () => {
	it("ctor", () => {
		const rc = new resize.ResizeConfiguration(2, 2, 100);
		expect(rc.deltaBlock).toBe(2);
		expect(rc.deltaInline).toBe(2);
		expect(rc.triggerTime).toBe(100);
	})
	it("ctor.fail.inline.undefined", () => {
		expect(()=>{
			const rc = new resize.ResizeConfiguration();
		}).toThrow(new Error("deltaInline: must be an integer"));
	})
	it("ctor.fail.inline", () => {
		expect(()=>{
			const rc = new resize.ResizeConfiguration(-1, -1, -1);
		}).toThrow(new Error("deltaInline: must be GE zero"));
	})
	it("ctor.fail.block.undefined", () => {
		expect(()=>{
			const rc = new resize.ResizeConfiguration(0);
		}).toThrow(new Error("deltaBlock: must be an integer"));
	})
	it("ctor.fail.block", () => {
		expect(()=>{
			const rc = new resize.ResizeConfiguration(0, -1, -1);
		}).toThrow(new Error("deltaBlock: must be GE zero"));
	})
	it("ctor.fail.trigger.undefined", () => {
		expect(()=>{
			const rc = new resize.ResizeConfiguration(0, 0);
		}).toThrow(new Error("triggerTime: must be an integer"));
	})
	it("ctor.fail.trigger", () => {
		expect(()=>{
			const rc = new resize.ResizeConfiguration(0, 0, 0);
		}).toThrow(new Error("triggerTime: must be GT zero"));
	})
})
function trackerPromise(rt, entries, config) {
	return new Promise(resolve => {
		entries.forEach(ex => {
			rt.track(ex.page, ex.dpsize);
		});
		rt.trackComplete(config, resize => resolve(resize));
		vi.runAllTimers();
	});
}
describe("ResizeTracker", () => {
	it("ctor", () => {
		const rt = new resize.ResizeTracker();
		expect(rt.active.size).toBe(0);
		expect(rt.lastKnown.size).toBe(0);
		expect(rt.trigger).toBe(-1);
	})
	it("track and reset", () => {
		const rt = new resize.ResizeTracker();
		const page1 = {};
		const size1 = {};
		const page2 = {};
		const size2 = {};
		const page3 = {};
		const size3 = {};
		rt.track(page1, size1);
		rt.track(page2, size2);
		rt.track(page3, size3);
		expect(rt.active.size).toBe(3);
		expect(rt.lastKnown.size).toBe(0);
		expect(rt.active.has(page1)).toBe(true);
		expect(rt.active.has(page2)).toBe(true);
		expect(rt.active.has(page3)).toBe(true);
		rt.reset();
		expect(rt.active.size).toBe(0);
		expect(rt.lastKnown.size).toBe(0);
	})
	it("trigger", async () => {
		const rt = new resize.ResizeTracker();
		const config = resize.ResizeConfiguration.defaultConfiguration();
		const page1 = {
			id: "page-1"
		};
		const size1 = {
			blockSize: 100,
			inlineSize: 100,
		};
		const page2 = {
			id: "page-2"
		};
		const size2 = {
			blockSize: 100,
			inlineSize: 100,
		};
		const page3 = {
			id: "page-3"
		};
		const size3 = {
			blockSize: 100,
			inlineSize: 100,
		};
		const entries = [
			{ page: page1, dpsize: size1 },
			{ page: page2, dpsize: size2 },
			{ page: page3, dpsize: size3 },
		];
		const output = await trackerPromise(rt, entries, config);
		expect(output).not.toBe(null);
		expect(output).not.toBe(undefined);
		expect(output.length).toBe(0);
		expect(rt.active.size).toBe(0);
		expect(rt.lastKnown.has(page1)).toBe(true);
		expect(rt.lastKnown.has(page2)).toBe(true);
		expect(rt.lastKnown.has(page3)).toBe(true);
		const size11 = {
			blockSize: 200,
			inlineSize: 200,
		};
		entries[0].dpsize = size11;
		const output2 = await trackerPromise(rt, entries, config);
		expect(output2.length).toBe(1);
		const target = output2[0];
		expect(target.target.id).toBe(page1.id);
		expect(target.db).toBe(100);
		expect(target.di).toBe(100);
		expect(target.upsize).toBe(true);
	})
})