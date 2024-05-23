import { vi, describe, it, expect } from 'vitest';
import { ScrollPlugin } from "../ScrollPlugin";
import { ScrollConfiguration } from '../ScrollConfiguration';
import { materializePages, PageContext } from '../PageContext';

vi.useFakeTimers();

class MockedObserver {
	cb;
	options;
	elements = [];

	constructor(cb, options) {
		this.cb = cb;
		this.options = options;
		this.elements = [];
	}

	unobserve(elem) {
		this.elements = this.elements.filter((en) => en !== elem);
	}

	observe(elem) {
		this.elements = [...new Set(this.elements.concat(elem))];
	}

	disconnect() {
		this.elements = [];
	}

	fire(arr) {
		this.cb(arr, this);
	}
}
Object.defineProperty(global, "IntersectionObserver", {
	writable: true,
	value: MockedObserver,
});

const pluginContext = (event, sc, pcs, pages) => {
	const pictx = {
		event,
		pageContexts: pcs ?? [],
		pages: pages ?? [],
		$emit: (name,obj) => console.log("$emit", name, obj),
		scrollConfiguration: sc,
		resizeConfiguration: undefined,
	};
	return pictx;
}
describe("ScrollPlugin", () => {
	it("lifecycle start/stop", () => {
		const pi = new ScrollPlugin();
		pi.start(pluginContext("loaded"));
		pi.stop(pluginContext("stop"));
		expect(pi.intersect).is.null;
		expect(pi.intersectTracker).is.null;
	})
	it("lifecycle connect/disconnect", () => {
		const pi = new ScrollPlugin();
		const config = new ScrollConfiguration(null, null, 100);
		pi.start(pluginContext("loaded", config));
		const target = {
			id: "page-1"
		};
		const pageContexts = [];
		materializePages(0, 0, "pdf-document", 3, pageContexts);
		const pages = pageContexts;
		pi.connect(pluginContext("connect", config, pageContexts, pages));
		expect(pi.intersect).is.not.null;
		pageContexts[0].mountContainer(target);
		const entries = [
			{ target, isIntersecting: true }
		];
		pi.intersect.fire(entries);
		vi.runAllTimers();
		pi.disconnect(pluginContext("disconnect", config, pageContexts, pages));
		expect(pi.intersect).is.not.null;
		pi.stop(pluginContext("stop", config));
		expect(pi.intersect).is.null;
		expect(pi.intersectTracker).is.null;
	})
})