<script>
import { PageManagement_Scroll, PdfComponent, PdfPage } from "../components"
import { ROW, TileConfiguration } from "../components"

export default {
	name: "Demo2View",
	components: {PdfComponent, PdfPage},
	methods: {
		handleLoaded(doc) {
			console.log("handle.loaded", doc);
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
		handlePreviousGroup(ev) {
			this.currentPage = Math.max(1, this.currentPage - this.tiles.total);
		},
		handleNextGroup(ev) {
			this.currentPage = this.currentPage + this.tiles.total;
		},
	},
	computed: {
		pages() { return new PageManagement_Scroll(this.currentPage - 1, this.tiles.total, undefined); }
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			errorMessage: null,
			currentPage: 1,
			tiles: new TileConfiguration(ROW, 2, 3),
		};
	}
}
</script>
<template>
	<h1>Tile Navigation Demo<button class="button" style="margin-left:1rem" @click="handlePreviousGroup">&lt;</button><button class="button" @click="handleNextGroup">&gt;</button></h1>
	<div v-if="errorMessage">{{errorMessage}}</div>
	<div>This demo uses Page Management to navigate through tiles, in this case 6 tiles.</div>
	<PdfComponent
		id="my-pdf"
		:textLayer="true"
		:annotationLayer="true"
		:tileConfiguration="tiles"
		:pageManagement="pages"
		containerClass="document-container"
		@loaded="handleLoaded"
		@loading-failed="handleError"
		@page-rendered="handlePageRendered"
		@rendering-failed="handleRenderingFailed"
		:source="url">
		<template #pre-page="slotProps">
			<div :style="{'grid-row': slotProps.gridRow,'grid-column': slotProps.gridColumn}">Page {{slotProps.pageNumber}}</div>
		</template>
		<template #page="slotProps">
			<PdfPage :page="slotProps"
				containerClass="page-container"
				canvasClass="page-stack"
				annotationLayerClass="page-stack"
				textLayerClass="page-stack"
			>
			<!--
			<template #page-overlay="slotProps">
				<div class="page-stack" style="text-align:center">Page {{slotProps.pageNumber}}</div>
			</template>
			-->
		</PdfPage>
		</template>
	</PdfComponent>
</template>
<style scoped>
/* use grid for sequence of pages */
/* use a containing element to provide the scrolling */
.document-container {
	display: grid;
	grid-template-columns: repeat(3,1fr);
	grid-template-rows: repeat(2,1fr);
	row-gap: .5rem;
	column-gap: .5rem;
	height: auto;
	width:80vw;
	margin: auto;
	box-sizing: border-box;
}
.page-container {
	display: grid;
	grid-template-columns: 100%;
	grid-template-rows: 100%;
	background: transparent;
	margin: auto;
	box-sizing: border-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
}
.button {
	display: inline;
	padding: .25rem;
	vertical-align: middle;
}
</style>
