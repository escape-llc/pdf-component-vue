import { vi, describe, it, expect } from 'vitest';
import { ResizePlugin } from "../ResizePlugin";
import { ResizeConfiguration, ResizeDynamicConfiguration } from '../ResizeConfiguration';
import { materializePages } from '../PageContext';
import { MockObserver, pluginContext } from './PluginMock';

vi.useFakeTimers();

Object.defineProperty(global, "IntersectionObserver", {
	writable: true,
	value: MockObserver,
});
Object.defineProperty(global, "ResizeObserver", {
	writable: true,
	value: MockObserver,
});

describe("ResizePlugin", () => {
	it("lifecycle start/stop", () => {
		const pi = new ResizePlugin();
		pi.start(pluginContext("loaded"));
		pi.stop(pluginContext("stop"));
		expect(pi.resizer).is.null;
		expect(pi.resizeTracker).is.null;
		expect(pi.resizeIntersect).is.null;
		expect(pi.resizeTrackerActive).is.null;
	})
	it("lifecycle connect/disconnect", () => {
		const pi = new ResizePlugin();
		const rconfig = ResizeConfiguration.defaultConfiguration();
		pi.start(pluginContext("loaded", undefined, rconfig));
		const target = {
			id: "page-1"
		};
		const pageContexts = [];
		materializePages(0, 0, "pdf-document", 3, pageContexts);
		const pages = pageContexts;
		const connect_ctx = pluginContext("connect", undefined, rconfig, pageContexts, pages);
		pi.connect(connect_ctx);
		expect(pi.resizer).is.not.null;
		pageContexts[0].mountContainer(target);
		const entries = [
			{
				target,
				devicePixelContentBoxSize: [
					{ inlineSize: 100, blockSize: 100 }
			]
			}
		];
		pi.resizer.fire(entries);
		vi.runAllTimers();
		const entries2 = [
			{
				target,
				devicePixelContentBoxSize: [
					{ inlineSize: 1000, blockSize: 1000 }
			]
			}
		];
		pi.resizer.fire(entries2);
		vi.runAllTimers();
		expect(connect_ctx.emitted.length).equals(1);
		const resize = connect_ctx.emitted[0];
		expect(resize.event).equals("resize-pages");
		expect(resize.data.length).equals(1);
		const info = resize.data[0];
		expect(info.page.id).equals("pdf-document-page-1");
		expect(info.upsize).equals(true);
		expect(info.di).equals(900);
		expect(info.db).equals(900);
		pi.disconnect(pluginContext("disconnect", undefined, rconfig, pageContexts, pages));
		expect(pi.intersect).is.not.null;
		pi.stop(pluginContext("stop", undefined, rconfig));
		expect(pi.resizer).is.null;
		expect(pi.resizeTracker).is.null;
		expect(pi.resizeIntersect).is.null;
		expect(pi.resizeTrackerActive).is.null;
	})
	it("lifecycle dynamic", () => {
		const pi = new ResizePlugin();
		const rconfig = ResizeDynamicConfiguration.defaultConfiguration();
		pi.start(pluginContext("loaded", undefined, rconfig));
		const target = {
			id: "page-1"
		};
		const pageContexts = [];
		materializePages(0, 0, "pdf-document", 3, pageContexts);
		const pages = pageContexts;
		const connect_ctx = pluginContext("connect", undefined, rconfig, pageContexts, pages);
		pi.connect(connect_ctx);
		expect(pi.resizer).is.not.null;
		pageContexts[0].mountContainer(target);
		const entries = [
			{
				target,
				devicePixelContentBoxSize: [
					{ inlineSize: 100, blockSize: 100 }
			]
			}
		];
		pi.resizer.fire(entries);
		vi.runAllTimers();
		const entries2 = [
			{
				target,
				devicePixelContentBoxSize: [
					{ inlineSize: 1000, blockSize: 1000 }
			]
			}
		];
		pi.resizer.fire(entries2);
		vi.runAllTimers();
		expect(connect_ctx.emitted.length).equals(1);
		const resize = connect_ctx.emitted[0];
		expect(resize.event).equals("resize-pages");
		expect(resize.data.length).equals(1);
		const info = resize.data[0];
		expect(info.page.id).equals("pdf-document-page-1");
		expect(info.upsize).equals(true);
		expect(info.di).equals(900);
		expect(info.db).equals(900);
		pi.disconnect(pluginContext("disconnect", undefined, rconfig, pageContexts, pages));
		expect(pi.intersect).is.not.null;
		pi.stop(pluginContext("stop", undefined, rconfig));
		expect(pi.resizer).is.null;
		expect(pi.resizeTracker).is.null;
		expect(pi.resizeIntersect).is.null;
		expect(pi.resizeTrackerActive).is.null;
	})
})