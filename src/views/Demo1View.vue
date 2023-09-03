<script>
import { PdfComponent } from "../components"

export default {
	name: "Demo1View",
	components: {PdfComponent},
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
	},
	data() {
		return {
			url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
			errorMessage: null,
		};
	}
}
</script>
<template>
	<h1>Basic Scrolling Demo</h1>
	<div v-if="errorMessage">{{errorMessage}}</div>
	<PdfComponent
		id="my-pdf"
		class="document-container"
		:textLayer="true"
		:annotationLayer="true"
		pageContainerClass="page-container"
		canvasClass="page-stack"
		annotationLayerClass="page-stack"
		textLayerClass="page-stack"
		@loaded="handleLoaded"
		@loading-failed="handleError"
		@page-rendered="handlePageRendered"
		@rendering-failed="handleRenderingFailed"
		:source="url">
		<template #pre-page="slotProps">
			<div style="text-align:center" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</template>
<style scoped>
/* use grid for sequence of pages */
/* use a containing element to provide the scrolling */
.document-container {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	row-gap: .5rem;
	margin: auto;
	margin-bottom: 2rem;
	box-sizing: border-box;
	height: auto;
	width:80vw;
}
/* use grid to stack the layers */
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
}
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width:100%;
}
</style>
