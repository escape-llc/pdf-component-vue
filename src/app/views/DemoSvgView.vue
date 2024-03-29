<template>
	<h1>SVG Render Mode</h1>
	<div class="badge-container">
		<div v-for="bg in badges" class="badge"><span class="badge-name">{{bg.name}}</span><span class="badge-value">{{bg.value}}</span></div>
	</div>
	<template v-if="renderComplete">
		<div class="render-complete" id="demo5-complete-loaded">Render Complete Loaded</div>
	</template>
	<template v-if="version.startsWith('3.')">
		<div>It is well-known the SVG renderer in <kbd>pdfjs</kbd> is <b>not reliable, unsupported</b> and labelled as "deprecated".  Use at your own risk!</div>
		<div>It is so buggy, the <kbd>tracemonkey</kbd> "reference" document has rendering errors (pages 2,11,13)!</div>
	</template>
	<template v-else>
		<div>The SVG renderer is not supported in <kbd>pdfjs</kbd> V4.  The component falls back to CANVAS rendering in this case.</div>
	</template>
	<div class="render-complete" v-if="renderComplete">Render Complete</div>
	<div class="error" v-if="errorMessage">{{errorMessage}}</div>
	<PdfComponent
		id="my-pdf"
		:renderMode="1"
		class="document-container"
		:textLayer="true"
		:annotationLayer="true"
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
			<div style="text-align:center" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</template>
<script>
import { PdfComponent } from "../../lib"
import { pdfjsDistSymbol } from "../../lib";

export default {
	name: "DemoSvgView",
	components: {PdfComponent},
	inject: {
		pdfjs: {
			from: pdfjsDistSymbol,
			default: undefined
		},
	},
	methods: {
		handleLoaded(doc) {
			console.log("handle.loaded", doc);
		},
		handleError(ev) {
			console.error("handle.load-error", ev);
			this.errorMessage = ev.message;
		},
		handlePageRendered(ev) {
			console.log("handle.rendered", ev);
			this.renderComplete = true;
		},
		handleRenderingFailed(ev) {
			console.error("handle.render-error", ev);
			this.errorMessage = ev.message;
			this.renderComplete = true;
		},
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			errorMessage: null,
			renderComplete: false,
			version: this.pdfjs.version,
			badges: [
				{ name: "size", value:"WIDTH" },
				{ name: "render", value: this.pdfjs.version.startsWith('3.') ? "SVG" : "CANVAS fallback" },
				{ name: "text-layer", value:"on" },
				{ name: "anno-layer", value:"on" },
				{ name: "page", value:"off" },
				{ name: "resize", value:"off" },
				{ name: "scroll", value:"off" },
				{ name: "tile", value:"off" },
				{ name: "slot", value:"pre-page" },
			],
		};
	}
}
</script>
<style scoped>
.error {
	color: red;
	font-style: italic;
}
.render-complete {
	display: none;
	margin: auto;
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
	contain: content;
}
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width:100%;
}
</style>
