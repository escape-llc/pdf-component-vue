import { vi, describe, it, expect } from 'vitest';
import { ScrollPlugin } from "../ScrollPlugin";
import { ScrollConfiguration } from '../ScrollConfiguration';
import { materializePages } from '../PageContext';
import { MockObserver, pluginContext } from './PluginMock';

vi.useFakeTimers();

Object.defineProperty(global, "IntersectionObserver", {
	writable: true,
	value: MockObserver,
});

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
		const connect_ctx = pluginContext("connect", config, undefined, pageContexts, pages);
		pi.connect(connect_ctx);
		expect(pi.intersect).is.not.null;
		pageContexts[0].mountContainer(target);
		const entries = [
			{ target, isIntersecting: true }
		];
		pi.intersect.fire(entries);
		vi.runAllTimers();
		expect(connect_ctx.emitted.length).equals(1);
		const visible = connect_ctx.emitted[0];
		expect(visible.event).equals("visible-pages");
		expect(visible.data.length).equals(1);
		expect(visible.data[0].id).equals("pdf-document-page-1");
		pi.disconnect(pluginContext("disconnect", config, undefined, pageContexts, pages));
		expect(pi.intersect).is.not.null;
		pi.stop(pluginContext("stop", config));
		expect(pi.intersect).is.null;
		expect(pi.intersectTracker).is.null;
	})
})