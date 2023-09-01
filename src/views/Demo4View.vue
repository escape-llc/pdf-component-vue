<script>
import { PdfComponent, PdfPage } from "../components"

export default {
	name: "Demo4View",
	components: {PdfComponent, PdfPage},
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
			console.log("handle.page", ev);
		},
		handleRenderingFailed(ev) {
			console.error("handle.render-error", ev);
			this.errorMessage = ev.message;
		},
		handleInput(ev) {
			console.log("handle.input", ev);
			const file = ev.target.files[0];
			//Step 2: Read the file using file reader
			const fileReader = new FileReader();
			const capture = this;
			fileReader.onload = function() {
					//Step 4:turn array buffer into typed array
					var typedarray = new Uint8Array(this.result);
					capture.source = typedarray;
					capture.fileName = file.name;
			};
			//Step 3:Read the file as ArrayBuffer
			fileReader.readAsArrayBuffer(file);
		},
	},
	data() {
		return {
			source: null,
			errorMessage: null,
			pageCount: undefined,
			fileName: undefined,
		};
	}
}
</script>
<template>
	<h1>Load Your Own PDF</h1>
	<input v-if="!source" type="file" ref="file" style="margin-top:.25rem;margin-bottom:.25rem" @change="handleInput"/>
	<div v-if="errorMessage">{{errorMessage}}</div>
	<h2 v-if="fileName" class="document-banner"><div>{{fileName}}</div><div class="document-banner-page">{{ pageCount }} Page(s)</div></h2>
	<PdfComponent
		id="my-pdf"
		:textLayer="true"
		:annotationLayer="true"
		containerClass="document-container"
		pageContainerClass="page-container"
		canvasClass="page-stack"
		annotationLayerClass="page-stack"
		textLayerClass="page-stack"
		@loaded="handleLoaded"
		@loading-failed="handleError"
		@page-rendered="handlePageRendered"
		@rendering-failed="handleRenderingFailed"
		:source="source">
		<template #pre-page="slotProps">
			<div style="text-align:center" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</template>
<style scoped>
.document-banner {
	display: flex;
	flex-direction: row;
}
.document-banner-page {
	flex-grow: 1;
	align-self: flex-end;
	text-align: end;
}
/* use grid for sequence of pages */
/* use a containing element to provide the scrolling */
.document-container {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	row-gap: .5rem;
	width: 80vw;
	height: auto;
	margin: auto;
	margin-bottom: 2rem;
	box-sizing: border-box;
}
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width:100%;
}
/* use grid to stack the layers */
:deep(.page-container) {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	background: transparent;
	margin: auto;
	box-sizing: border-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	width:80vw;
}
</style>
