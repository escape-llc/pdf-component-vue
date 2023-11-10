<template>
	<h1>Resize Pages</h1>
	<div>Use the buttons to resize.  When switching to <b>wide</b>, the <code>canvas</code> is re-rendered at the new size, so it appears sharp.
		The text and annotation layers are also rescaled.  You can verify this by selecting some text in narrow then resizing to wide.</div>
	<div>Without this feature, you would get the smaller <code>canvas</code> scaled up, and the other layers would be misaligned.</div>
	<div class="button-container">
		<button class="button" :disabled="width !== 'wide'" @click="handleNarrow">Narrow</button>
		<button class="button" :disabled="width === 'wide'" @click="handleWide">Wide</button>
	</div>
	<div class="error" v-if="errorMessage">{{errorMessage}}</div>
	<PdfComponent
		id="my-pdf"
		class="document-container"
		:class="{'document-wide': width === 'wide', 'document-narrow': width !== 'wide'}"
		:textLayer="true"
		:annotationLayer="true"
		:resizeConfiguration="resize"
		pageContainerClass="page-container"
		canvasClass="page-stack"
		annotationLayerClass="page-stack"
		textLayerClass="page-stack"
		@loaded="handleLoaded"
		@load-failed="handleError"
		@page-rendered="handlePageRendered"
		@render-failed="handleRenderingFailed"
		:source="url">
		<template #pre-page="slotProps">
			<div style="text-align:center" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</template>
<script>
import { PdfComponent } from "../components";
import { ResizeConfiguration } from "../components";

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
		handleWide(ev) {
			this.width = "wide";
		},
		handleNarrow(ev) {
			this.width = "narrow";
		},
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			errorMessage: null,
			width: "narrow",
			resize: ResizeConfiguration.defaultConfiguration(),
		};
	}
}
</script>
<style scoped>
.error {
	color: red;
	font-style: italic;
}
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
	transition: width .1s ease-in-out, height .1s ease-in-out;
}
.document-narrow {
	width: 40vw;
}
.document-wide {
	width: 90vw;
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
.button-container {
	width: 20rem;
	margin: auto;
	margin-top: .5rem;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: 1fr 1fr;
}
.button {
	padding: .2rem;
	justify-self: center;
	align-self:center;
	vertical-align: middle;
}
</style>
