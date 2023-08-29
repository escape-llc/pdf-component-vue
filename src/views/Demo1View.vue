<script>
import { PdfComponent, PdfPage } from "../components"

export default {
	name: "Demo1View",
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
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
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
		:textLayer="true"
		:annotationLayer="true"
		containerClass="document-container"
		@loaded="handleLoaded"
		@loading-failed="handleError"
		@page-rendered="handlePageRendered"
		@rendering-failed="handleRenderingFailed"
		style="width:80vw" :source="url">
		<template #pre-page="slotProps">
			<div style="margin-left:.2rem;width:5rem">Page {{slotProps.pageNumber}}</div>
		</template>
		<template #page="slotProps">
			<PdfPage :page="slotProps"
				containerClass="page-container"
				canvasClass="page-stack"
				annotationLayerClass="page-stack"
				textLayerClass="page-stack"
			/>
		</template>
	</PdfComponent>
</template>
<style scoped>
/* use grid for sequence of pages */
/* use a containing element to provide the scrolling */
.document-container {
	display: grid;
	grid-template-columns: 100% 1fr;
	grid-template-rows: auto 1fr;
	row-gap: .5rem;
	width: 100%;
	height: auto;
	margin: auto;
	margin-bottom: 2rem;
	box-sizing: border-box;
}
/* each page takes up one grid */
.page-N {
	grid-area: N / 1 / N / 1;
	box-sizing: border-box;
	background: transparent;
}
/* use grid to stack the layers */
.page-container {
	display: grid;
	grid-template-columns: 100% 1fr;
	grid-template-rows: 100% 1fr;
	background: transparent;
	margin: auto;
	box-sizing: border-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	width:100%;
}
</style>
