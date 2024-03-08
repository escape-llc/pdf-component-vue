<template>
	<div class="flex flex-col w-full touch-auto ">
	<input type="file" ref="file" style="margin-top:.25rem;margin-bottom:.25rem" @change="handleInput"/>
	<div v-if="errorMessage" class="flex error">{{ errorMessage }}</div>
	<div v-if="isLoading" class="flex justify-center items-center w-full h-full">
			Loading...
	</div>
		<div ref="sidebar" class="flex w-full">
			<pdf-component :id="`pdf`"
					:ref="`pdf`"
					:annotationLayer="true"
					:commandPort="command"
					:pageManagement="sidebarPages"
					:scrollConfiguration="scroll"
					:source="url"
					:textLayer="true"
					annotationLayerClass="page-stack"
					canvasClass="page-stack"
					class="document-container"
					:pageContainerClass="pageContainer"
					textLayerClass="page-stack"
					@loaded="handleLoaded"
					@rendered="handleRendered"
					@command-complete="handleCommandComplete"
					@load-failed="handleError"
					@render-failed="handleRenderingFailed"
					@page-click="handlePageClick"
					@visible-pages="handleVisiblePages">
					<template #pre-page="slotProps">
						<div :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }"
							style="text-align:center;font-weight:bold;">{{ slotProps.pageLabel ?? `Page ${slotProps.pageNumber}` }}
						</div>
					</template>
			</pdf-component>
		</div>
	</div>
</template>
<script setup>
import {ref, onMounted, computed} from 'vue'
import {
	PageManagement_Scroll,
	PageManagement_UpdateRange,
	PdfComponent,
	ScrollConfiguration,
	unwrapOutline,
} from "../../lib"

import {Command, ScrollToPage} from "../../lib";

import {inject} from "vue";


let fileName =  ref(undefined)
let selectedPage = ref(null)
let pageCount = ref(undefined)
let isLoading = ref(false)
const pdf = ref(null)
const sidebar = ref(null)
const url = ref(null)
const src = ref(null)
let cacheStartPage = ref(1)
let scroll = ref(undefined)
let scrollStart = ref(0)
let scrollStop = ref(4)
let config = ref()
let outline = ref()
let errorMessage = ref()
let command = ref(null)
const props = defineProps(
	{
			name: {
					type: String,
			},
	}
)

class OutlineTree extends Command {
	async execute(ctx) {
			const outline = await unwrapOutline(ctx.document);
			// console.log("OutlineTree", outline);
			// convert to format needed for the tree view
			const nodes = {};
			const config = {
					roots: [],
					padding: 0,
			};
			let symx = 1;

			function processLevel(level, parent) {
					level.forEach(ox => {
							const id = `id${symx++}`;
							const node = {
									text: ox.outline.title,
									pageIndex: ox.pageIndex,
									children: [],
									state: {disabled: false, hidden: false}
							};
							nodes[id] = node;
							parent.children.push(id);
							if (ox.items.length) {
									processLevel(ox.items, node);
							}
					});
			}

			outline.forEach(ox => {
					const id = `id${symx++}`;
					if (ox.error) return;
					const node = {
							text: ox.outline.title,
							pageIndex: ox.pageIndex,
							children: [],
							state: {disabled: false, hidden: false}
					};
					nodes[id] = node;
					config.roots.push(id);
					if (ox.items.length) {
							processLevel(ox.items, node);
					}
			});
			return {outline, config, nodes};
	}
}

const pages = computed(() => {
	return new PageManagement_Scroll(cacheStartPage.value - 1, new PageManagement_UpdateRange(scrollStart.value, scrollStop.value));
})
const sidebarPages = computed(() => {
	return new PageManagement_UpdateRange(scrollStart.value, scrollStop.value);
})
const pageContainer = (page) => {
	return calcPageClass(page.pageNumber);
}
const calcPageClass = (pageNumber) => {
	//console.log('TEST '+ pageNumber)
	const css = ["page-container"];
	if (pageNumber === selectedPage.value) {
			css.push("page-selected");
	}
	return css.join(" ");
}
const handleLoaded = (doc) => {
	//isLoading = true;
	// console.log("sidebar.loaded", doc);
	pageCount.value = doc.numPages;
	// selectedPage.value = 1;
	scroll.value = new ScrollConfiguration(sidebar.$el, "64px 0px 0px 64px");
	command.value = new OutlineTree();
}
const handleError = (ev) => {
	console.error("handle.load-error", ev);
	isLoading = false
	errorMessage.value = "Load: " + ev.message;
};
const handleInput = (ev) => {
		console.log("handle.input", ev);
		const file = ev.target.files[0];
		//Step 1: Read the file using file reader
		const fileReader = new FileReader();
		// we must capture THIS so the ONLOAD callback below can access it
		// the handler binds THIS itself so we cannot use a bind or arrow function
		const capture = this;
		fileReader.onload = function() {
			//Step 3:turn array buffer into typed array
			const u8a = new Uint8Array(this.result);
			// each instance requires a separate copy of the buffer
			url.value = u8a;
			// this makes a copy, which is necessary

			fileName.value = file.name;
		};
		//Step 2:Read the file as ArrayBuffer
		fileReader.readAsArrayBuffer(file);
	};
const handlePageClick = async (ev) => {
	isLoading = true
	// updatePage(ev.page + 1)
	waitForElm(`#pdf--page-${ev.page + 1}`).then((elm) => {
			updatePage(ev.page + 1)
			isLoading = false
	});

}
const handleCommandComplete = (ev) => {
	// console.log("handleCommandComplete", ev);
	if (ev.command instanceof OutlineTree) {
			if (ev.ok) {
					// put the command result into reactive state
					config.value = ev.result.config;
					if (ev.result.outline.length > 0) {
							outline.value = ev.result.nodes;
					} else {
							outline.value = undefined;
					}
			} else {
					outline.value = undefined;
			}
	}
}
const updatePage = (pageNumber) => {
	selectedPage.value = pageNumber;
	if (pageNumber > 0) {
			cacheStartPage.value = pageNumber;
	}
	// sync the sidebar to this page
	command.value = new ScrollToPage(pageNumber);
}
function waitForElm(selector) {
	return new Promise(resolve => {
			if (document.querySelector(selector)) {
					return resolve(document.querySelector(selector));
			}

			const observer = new MutationObserver(mutations => {
					if (document.querySelector(selector)) {
							observer.disconnect();
							resolve(document.querySelector(selector));
					}
			});

			observer.observe(document.body, {
					childList: true,
					subtree: true
			});
	});
}
const handleVisiblePages = (ev) => {
	console.log("visible pages", ev);
	// get page range visible and create a PageManagment instance to fufill it
	const indexes = ev.map(xx => xx.index);
	const min = Math.min(...indexes);
	const max = Math.max(...indexes);
	// pad the region so nearby off-screen pages are rendered
	// this avoids FoUC when clicking the sidebar's scroll bar
	// console.log('Page count value ' + pageCount.value)
	// console.log('START ' + scrollStart.value)
	// console.log('STOP ' + scrollStop.value)
	const margin = Math.floor(ev.length / 2) +1;
	// console.log('Margin ' + margin)
	scrollStart.value = Math.max(0, min - margin);
	scrollStop.value = Math.min(pageCount.value - 1, max + margin);
}
const handleRendered = (ev) => {
	// console.log('Render event '+ev)
	isLoading = false
}
const handleRenderingFailed = (ev) => {
	isLoading = false
	console.error("sidebar.render-error", ev);
	// errorMessage.value = "Render Sidebar: " + ev.message;
}
onMounted(() => {
src.value = './assets/the-idiot.pdf'
	// emitter.on('selectPage', e => {
	//     console.log('selectPage ' + e.page)
	//     console.log('uploadId  ' + e.pdf_id)
	//     handlePageClick(e)

	// })
})


</script>

<style scoped>
.document-container {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	row-gap: .5rem;
	margin: auto;
	margin-bottom: 2rem;
	box-sizing: border-box;
	width: 100%;
	height: auto;
}
:deep(.page-container) {
	display: grid;
	grid-template-columns: 100%;
	grid-template-rows: 100%;
	background: transparent;
	margin: auto;
	box-sizing: border-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	width:100%;
	contain: content;
}

.main-container {
	display: flex;
	flex-direction: row;
	width: calc(100vw - 2rem);
	max-height: 92vh;
	overflow: hidden;
	margin-top: .25rem;
	box-sizing: border-box;
}

:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width: 100%;
}

:deep(.page-selected) {
	transition: box-shadow .5s ease-in;
	box-shadow: 0 1px 4px 2px rgba(252, 1, 210, 0.25);
}
</style>
