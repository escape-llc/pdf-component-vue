import { describe, it, expect } from 'vitest'

import { mount, flushPromises } from '@vue/test-utils'
import PdfComponent from '../PdfComponent.vue'

function mountedPromise(source) {
	return new Promise((resolve, reject) => {
			const wrapper = mount(PdfComponent, {
				props: {
					id: "my-pdf",
					source: source,
					containerClass: "document-container",
					onLoaded: () => {
						resolve(wrapper);
					},
					"onLoading-failed": e => {
						reject(e);
					}
				}
		});
	});
}
describe.skip('PdfComponent', () => {
	const PDF = "http://localhost:5173/tracemonkey.pdf";
	it.skip('loadDocument loading-failed', async () => {
		let loading = false;
		let error = undefined;
		const wrapper = mount(PdfComponent, {
			props: {
				id: "my-pdf",
				containerClass: "document-container",
				onLoaded: () => {
					loading = true;
				},
				"onLoading-failed": e => {
					error = e;
				}
			}
		});
		await wrapper.vm.loadDocument("/bogus.pdf");
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toContain('my-pdf');
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(loading).toBe(false);
		expect(error).not.toBe(undefined);
		expect(wrapper.emitted()).toHaveProperty("loading-failed");
	})
	it('loadDocument loading', async () => {
		let loading = false;
		let error = undefined;
		const wrapper = await mountedPromise(PDF);
		await wrapper.vm.$nextTick();
		await wrapper.vm.renderPages();
		await wrapper.vm.$nextTick();
		await flushPromises();
		expect(wrapper.html()).toContain('my-pdf');
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(loading).toBe(true);
		expect(error).toBe(undefined);
	})
	it.skip('props.source loading', async () => {
		let loading = false;
		let error = undefined;
		const wrapper = mount(PdfComponent, {
			props: {
				id: "my-pdf",
				containerClass: "document-container",
				onLoaded: () => {
					loading = true;
				},
				"onLoading-failed": e => {
					error = e;
				}
			}
		});
		await wrapper.setProps({source: PDF});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toContain('my-pdf');
		const div = wrapper.get("div");
		expect(div).not.toBe(undefined);
		expect(wrapper.emitted()).toHaveProperty("loaded");
		expect(loading).toBe(true);
		expect(error).toBe(undefined);
	})
})
