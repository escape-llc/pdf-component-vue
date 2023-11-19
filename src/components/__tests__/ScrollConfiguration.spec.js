import { vi, describe, it, expect } from 'vitest'
import * as scroll from "../ScrollConfiguration";

vi.useFakeTimers();

describe("ScrollConfiguration", () => {
	it("ctor", () => {
		const rc = new scroll.ScrollConfiguration(undefined, "", 100);
		expect(rc.root).toBe(undefined);
		expect(rc.rootMargin).toBe("");
		expect(rc.triggerTime).toBe(100);
	})
})
function trackerPromise(rt, entries, config) {
	return new Promise(resolve => {
		entries.forEach(ex => {
			rt.track(ex.page, ex.ex);
		});
		rt.trackComplete(config, resize => resolve(resize));
		vi.runAllTimers();
	});
}
describe("ScrollTracker", () => {
	it("ctor", () => {
		const rt = new scroll.ScrollTracker();
		expect(rt.active.size).toBe(0);
		expect(rt.trigger).toBe(-1);
	})
	it("track and reset", async () => {
		const rt = new scroll.ScrollTracker();
		const page1 = {};
		const size1 = { isIntersecting: true };
		const page2 = {};
		const size2 = { isIntersecting: true };
		const page3 = {};
		const size3 = { isIntersecting: true };
		rt.track(page1, size1);
		rt.track(page2, size2);
		rt.track(page3, size3);
		expect(rt.active.size).toBe(3);
		expect(rt.active.has(page1)).toBe(true);
		expect(rt.active.has(page2)).toBe(true);
		expect(rt.active.has(page3)).toBe(true);
		rt.reset();
		expect(rt.active.size).toBe(0);
	})
	it("trigger", async () => {
		const rt = new scroll.ScrollTracker();
		const config = new scroll.ScrollConfiguration(undefined, "", 100);
		const page1 = {
			id: "page-1"
		};
		const size1 = {
			isIntersecting: true,
			blockSize: 100,
			inlineSize: 100,
		};
		const page2 = {
			id: "page-2"
		};
		const size2 = {
			isIntersecting: true,
			blockSize: 100,
			inlineSize: 100,
		};
		const page3 = {
			id: "page-3"
		};
		const size3 = {
			isIntersecting: true,
			blockSize: 100,
			inlineSize: 100,
		};
		const entries = [
			{ page: page1, ex: size1 },
			{ page: page2, ex: size2 },
			{ page: page3, ex: size3 },
		];
		const output = await trackerPromise(rt, entries, config);
		expect(output).not.toBe(null);
		expect(output).not.toBe(undefined);
		expect(output.length).toBe(3);
		expect(rt.active.size).toBe(3);
		expect(rt.active.has(page1)).toBe(true);
		expect(rt.active.has(page2)).toBe(true);
		expect(rt.active.has(page3)).toBe(true);
		const size11 = {
			isIntersecting: false,
			blockSize: 200,
			inlineSize: 200,
		};
		entries[0].ex = size11;
		const output2 = await trackerPromise(rt, entries, config);
		expect(output2.length).toBe(2);
		const target = output2[0];
		expect(target.id).toBe(page2.id);
	})
	it("defer", async () => {
		let counter = 0;
		function resolve(resize) {
			counter++;
			console.log("defer resolved", counter, resize);
		}
		const rt = new scroll.ScrollTracker();
		const config = new scroll.ScrollConfiguration(undefined, "", 100);
		const entries = [];
		entries.forEach(ex => {
			rt.track(ex.page, ex.ex);
		});
		// simulate multiple calls before a timeout
		rt.trackComplete(config, resize => resolve(resize));
		rt.trackComplete(config, resize => resolve(resize));
		vi.runAllTimers();
		expect(counter).toBe(1);
	})
	it("reset", async () => {
		let counter = 0;
		function resolve(resize) {
			counter++;
			console.log("defer resolved", counter, resize);
		}
		const rt = new scroll.ScrollTracker();
		const config = new scroll.ScrollConfiguration(undefined, "", 100);
		const entries = [];
		entries.forEach(ex => {
			rt.track(ex.page, ex.ex);
		});
		// simulate reset before a timeout
		rt.trackComplete(config, resize => resolve(resize));
		rt.reset();
		vi.runAllTimers();
		expect(counter).toBe(0);
	})
})