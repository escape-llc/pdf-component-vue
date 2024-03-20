<template>
	<div style="margin-left:5rem;margin-right:5rem;">
		<h1>Resize</h1>
		<div class="badge-container">
			<div v-for="bg in badges" class="badge"><span class="badge-name">{{bg.name}}</span><span class="badge-value">{{bg.value}}</span></div>
		</div>
		<template v-if="renderComplete">
			<div v-if="command === 'narrow'" id="demo5-complete-narrow" class="render-complete">Render Complete Narrow</div>
			<div v-else-if="command === 'wide'" id="demo5-complete-wide" class="render-complete">Render Complete Wide</div>
			<div v-else class="render-complete" id="demo5-complete-loaded">Render Complete Loaded</div>
		</template>
		<div>Use the buttons to resize.  The first time <b>wide</b> is clicked, the <code>canvas</code> re-renders at the new size, so it appears sharp.
			The text and annotation layers are also rescaled.  You can verify this by selecting some text in narrow then resizing to wide.</div>
		<div>Without this feature, you would get the smaller <code>canvas</code> scaled up, and the other layers would be misaligned.</div>
		<div>Dynamic CSS rescaling is also enabled; the <kbd>ResizeObserver</kbd>callbacks triggered by the <kbd>width</kbd> transition updates only visible elements.
			Without this feature, you would get unstyled content during the transition, before the trigger redraws.</div>
	</div>
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
		@rendered="handlePageRendered"
		@render-failed="handleRenderingFailed"
		@resize-pages="handleResizePages"
		@resize-complete="handleResizeComplete"
		:source="url">
		<template #pre-page="slotProps">
			<div style="text-align:center" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</template>
<script>
import { PdfComponent } from "../../lib";
import { ResizeConfiguration, ResizeDynamicConfiguration } from "../../lib";

export default {
	name: "Demo5View",
	components: {PdfComponent},
	methods: {
		handleLoaded(doc) {
			console.log("handle.loaded", doc);
			this.resize = this.calcResize;
		},
		handleError(ev) {
			console.error("handle.load-error", ev);
			this.errorMessage = ev.message;
			this.renderComplete = true;
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
		handleResizeComplete(ev) {
			console.log("handle.resize-complete", this.command, ev);
			this.renderComplete = true;
		},
		handleResizePages(ev) {
			console.log("handle.resize", this.command, ev);
		},
		handleWide(ev) {
			this.renderComplete = false;
			this.command = "wide";
			this.width = "wide";
		},
		handleNarrow(ev) {
			this.renderComplete = false;
			this.command = "narrow";
			this.width = "narrow";
		},
	},
	computed: {
		// IMPORTANT to use the correct element for scrolling!
		// in this case we are using the viewport (NULL)
		calcResize() { return this.dynamicRescale ? ResizeDynamicConfiguration.defaultConfiguration(null, "64px 0px 0px 64px") : ResizeConfiguration.defaultConfiguration(); },
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			errorMessage: null,
			width: "narrow",
			dynamicRescale: true,
			resize: ResizeConfiguration.defaultConfiguration(),
			renderComplete: false,
			command: null,
			badges: [
				{ name: "size", value:"WIDTH" },
				{ name: "render", value: "CANVAS" },
				{ name: "text-layer", value:"on" },
				{ name: "anno-layer", value:"on" },
				{ name: "page", value:"off" },
				{ name: "resize", value:"dynamic" },
				{ name: "scroll", value:"off" },
				{ name: "tile", value:"off" },
				{ name: "slot", value:"pre-page" },
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
	contain: content;
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
