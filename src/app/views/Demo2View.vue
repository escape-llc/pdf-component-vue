<template>
	<h1>Tiles and Navigation
		<button class="button" :disabled="currentPage == 1" style="margin-left:1rem" @click="handlePreviousGroup">&lt;</button>
		<button class="button" :disabled="currentPage >= pageCount - tiles.total" @click="handleNextGroup">&gt;</button>
	</h1>
	<div class="render-complete" v-if="renderComplete">Render Complete</div>
	<div class="error" v-if="errorMessage">{{errorMessage}}</div>
	<div style="margin-top:1rem;margin-bottom:1rem">This demo uses Page Management to navigate through tiles, in this case 6 tiles.</div>
	<PdfComponent
		id="my-pdf"
		class="document-container"
		:textLayer="false"
		:annotationLayer="false"
		:sizeMode="sizeMode"
		:tileConfiguration="tiles"
		:pageManagement="pages"
		pageContainerClass="page-container"
		canvasClass="page-stack"
		annotationLayerClass="page-stack"
		textLayerClass="page-stack"
		@loaded="handleLoaded"
		@load-failed="handleError"
		@rendered="handlePageRendered"
		@render-failed="handleRenderingFailed"
		:source="url">
		<template #pre-page="slotProps">
			<div :style="{'grid-row': slotProps.gridRow,'grid-column': slotProps.gridColumn}">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</template>
<script>
import { PageManagement_Scroll, PageManagement_UpdateZones, PdfComponent } from "../../components"
import { ROW, HEIGHT, TileConfiguration } from "../../components"

export default {
	name: "Demo2View",
	components: {PdfComponent},
	methods: {
		handleLoaded(doc) {
			console.log("handle.loaded", doc);
			this.pageCount = doc.numPages;
		},
		handleError(ev) {
			console.error("handle.load-error", ev);
			this.errorMessage = ev.message;
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
		handlePreviousGroup(ev) {
			this.renderComplete = false;
			this.currentPage = Math.max(1, this.currentPage - this.tiles.total);
		},
		handleNextGroup(ev) {
			this.renderComplete = false;
			if(this.currentPage + this.tiles.total < this.pageCount) {
				this.currentPage = this.currentPage + this.tiles.total;
			}
		},
	},
	computed: {
		pages() { return new PageManagement_Scroll(this.currentPage - 1, new PageManagement_UpdateZones(this.currentPage - 1, this.tiles.total, undefined)); }
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			errorMessage: null,
			currentPage: 1,
			sizeMode: HEIGHT,
			pageCount: 0,
			tiles: new TileConfiguration(ROW, 2, 3),
			renderComplete: false,
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
	grid-template-columns: repeat(3,33%);
	grid-template-rows: repeat(2,50%);
	row-gap: .5rem;
	column-gap: .5rem;
	margin: auto;
	box-sizing: border-box;
	height: 70vh;
	width: 80vw;
}
:deep(.page-container) {
	display: grid;
	grid-template-columns: 100%;
	grid-template-rows: 100%;
	background: transparent;
	margin:auto;
	box-sizing: border-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	height: 100%;
	contain: content;
}
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width:100%;
}
.button {
	display: inline;
	padding: .25rem;
	vertical-align: middle;
}
</style>
