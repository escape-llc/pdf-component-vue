<script>
import { PdfComponent } from "../components"
import { HEIGHT } from '../components';
import { ROW, TileConfiguration, PageManagement_UpdateCache } from '../components';

export default {
	name: "Demo3View",
	components: {PdfComponent},
	methods: {
		handleLoaded(doc) {
			console.log("handle.loaded", doc);
			this.selectedPage = 1;
		},
		handleError(ev) {
			console.error("handle.load-error", ev);
			this.errorMessage = ev.message;
		},
		handlePageRendered(ev) {
			console.log("handle.page", ev);
		},
		handleRenderingFailed(ev) {
			console.error("handle.render-error", ev);
			this.errorMessage = ev.message;
		},
		handlePageClick(ev) {
			console.log("handle.pageClick", ev);
			if(ev.pageNumber === this.selectedPage) {
				this.selectedPage = undefined;
			}
			else {
				this.selectedPage = ev.pageNumber;
				if(ev.pageNumber > 0) {
					this.cacheStartPage = ev.pageNumber;
				}
			}
		},
		pageContainer(page) {
			return this.calcPageClass(page.pageNumber);
		},
		calcPageClass(pageNumber) {
			const css = ["page-container"];
			if(pageNumber === this.selectedPage) {
				css.push("page-selected");
			}
			return css.join(" ");
		}
	},
	computed: {
		pages() { return new PageManagement_UpdateCache(this.cacheStartPage - 1, 3, undefined); }
	},
	data() {
		return {
			url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
			tiles: new TileConfiguration(ROW, 4, 4),
			errorMessage: null,
			currentPage: 1,
			sizeMode: HEIGHT,
			selectedPage: null,
			// MUST be initialized BEFORE loaded event
			cacheStartPage: 1,
		};
	}
}
</script>
<template>
	<h1>Page Management Demo</h1>
	<div v-if="errorMessage">{{errorMessage}}</div>
	<div>This demonstrates the Hot and Warm zones of page management. The Hot zone is set to 3, so 3 pages either side of the "currentPage" is rendered. The remaining pages are Warm and render as "placeholders".</div>
	<div>Click on a page frame to change the "currentPage".  In a typical case, the unrendered tiles are not visible to the user.</div>
	<PdfComponent
		id="my-pdf"
		class="document-container"
		:textLayer="true"
		:annotationLayer="true"
		:sizeMode="sizeMode"
		:tileConfiguration="tiles"
		:pageManagement="pages"
		:pageContainerClass="pageContainer"
		canvasClass="page-stack"
		annotationLayerClass="page-stack"
		textLayerClass="page-stack"
		@page-click="handlePageClick"
		@loaded="handleLoaded"
		@loading-failed="handleError"
		@page-rendered="handlePageRendered"
		@rendering-failed="handleRenderingFailed"
		:source="url">
		<template #pre-page="slotProps">
			<div :style="{'grid-row': slotProps.gridRow,'grid-column': slotProps.gridColumn}">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</template>
<style scoped>
/* use grid for sequence of pages */
/* use a containing element to provide the scrolling */
.document-container {
	display: grid;
	grid-template-columns: repeat(4,25%);
	grid-template-rows: repeat(4,25%);
	row-gap: .5rem;
	column-gap: .5rem;
	margin: auto;
	box-sizing: border-box;
	height: 80vh;
	width: 80vw;
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
	height: 100%;
}
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width:100%;
}
:deep(.page-selected) {
	border: 2px solid magenta;
}
</style>
