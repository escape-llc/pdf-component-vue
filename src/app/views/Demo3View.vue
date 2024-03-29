<template>
	<h1>Page Management</h1>
	<div class="badge-container">
		<div v-for="bg in badges" class="badge"><span class="badge-name">{{bg.name}}</span><span class="badge-value">{{bg.value}}</span></div>
	</div>
	<div class="render-complete" v-if="renderComplete">Render Complete</div>
	<div class="error" v-if="errorMessage">{{errorMessage}}</div>
	<div style="margin-top:1rem">This demonstrates the Hot and Warm zones of page management. The Hot zone is set to 3, so 3 pages either side of the "currentPage" is rendered. The remaining pages are Warm and render as "placeholders".</div>
	<div style="margin-bottom:1rem">Click on a page frame to change the "currentPage".  In a typical case, the unrendered tiles are not visible to the user (see next demo).</div>
	<PdfComponent
		id="my-pdf"
		class="document-container"
		:textLayer="false"
		:annotationLayer="true"
		:sizeMode="sizeMode"
		:tileConfiguration="tiles"
		:pageManagement="pages"
		:pageContainerClass="pageContainer"
		canvasClass="page-stack"
		annotationLayerClass="page-stack"
		textLayerClass="page-stack"
		placeholderClass="page-placeholder-stack"
		@page-click="handlePageClick"
		@loaded="handleLoaded"
		@load-failed="handleError"
		@rendered="handlePageRendered"
		@render-failed="handleRenderingFailed"
		:source="url">
		<template #pre-page="slotProps">
			<div :style="{'grid-row': slotProps.gridRow,'grid-column': slotProps.gridColumn}">Page {{slotProps.pageNumber}}</div>
		</template>
		<template #placeholder="slotProps">
			<div style="align-self: center;text-align: center;">warm page {{ slotProps.pageNumber }}</div>
		</template>
	</PdfComponent>
</template>
<script>
import { PdfComponent } from "../../lib"
import { HEIGHT } from '../../lib';
import { ROW, TileConfiguration, PageManagement_UpdateZones } from '../../lib';

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
			this.renderComplete = true;
		},
		handlePageRendered(ev) {
			console.log("handle.render", ev);
			this.renderComplete = true;
		},
		handleRenderingFailed(ev) {
			console.error("handle.render-error", ev);
			this.errorMessage = ev.message;
			this.renderComplete = true;
		},
		handlePageClick(ev) {
			console.log("handle.pageClick", ev);
			if(ev.page.pageNumber === this.selectedPage) {
				this.selectedPage = undefined;
			}
			else {
				this.selectedPage = ev.page.pageNumber;
				if(ev.page.pageNumber > 0) {
					this.renderComplete = false;
					this.cacheStartPage = ev.page.pageNumber;
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
		pages() { return new PageManagement_UpdateZones(this.cacheStartPage - 1, 3, undefined); }
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			tiles: new TileConfiguration(ROW, 4, 4),
			errorMessage: null,
			currentPage: 1,
			sizeMode: HEIGHT,
			selectedPage: null,
			// MUST be initialized BEFORE loaded event
			cacheStartPage: 1,
			renderComplete: false,
			badges: [
				{ name: "size", value:"HEIGHT" },
				{ name: "render", value: "CANVAS" },
				{ name: "text-layer", value:"off" },
				{ name: "anno-layer", value:"off" },
				{ name: "page", value:"on" },
				{ name: "resize", value:"off" },
				{ name: "scroll", value:"off" },
				{ name: "tile", value:"4x4" },
				{ name: "slot", value:"pre-page" },
				{ name: "slot", value:"placeholder" },
			],
		};
	}
}
</script>
<style scoped>
.render-complete {
	display: none;
	margin: auto;
}
.error {
	color: red;
	font-style: italic;
}
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
	box-sizing: content-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	height: 100%;
	transition: box-shadow .5s ease-in;
	contain: content;
}
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: content-box;
	background: transparent;
	width:100%;
}
/* placeholder needs GRID so we can center the slot contents */
:deep(.page-placeholder-stack) {
	display: grid;
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: content-box;
	background: transparent;
	width:100%;
}
:deep(.page-selected) {
	transition: box-shadow .5s ease-in;
	box-shadow: 0 1px 4px 2px rgba(252, 1, 210, 0.25);
}
</style>
