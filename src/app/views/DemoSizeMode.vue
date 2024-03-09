<template>
	<div style="width:100%">
	<div style="width:90vw; margin:auto">
		<h1>Size Modes</h1>
		<div class="badge-container">
			<div class="badge"><span class="badge-name">size</span><span class="badge-value">WIDTH</span></div>
			<div class="badge"><span class="badge-name">size</span><span class="badge-value">HEIGHT</span></div>
			<div class="badge"><span class="badge-name">size</span><span class="badge-value">SCALE</span></div>
			<div class="badge"><span class="badge-name">render</span><span class="badge-value">CANVAS</span></div>
			<div class="badge"><span class="badge-name">page</span><span class="badge-value">off</span></div>
			<div class="badge"><span class="badge-name">resize</span><span class="badge-value">on</span></div>
			<div class="badge"><span class="badge-name">scroll</span><span class="badge-value">off</span></div>
			<div class="badge"><span class="badge-name">tile</span><span class="badge-value">off</span></div>
			<div class="badge"><span class="badge-name">slot</span><span class="badge-value">pre-page</span></div>
		</div>
		<template v-if="renderComplete">
			<div v-if="command === 'narrow'" id="demo5-complete-narrow" class="render-complete">Render Complete Narrow</div>
			<div v-else-if="command === 'wide'" id="demo5-complete-wide" class="render-complete">Render Complete Wide</div>
			<div v-else class="render-complete" id="demo5-complete-loaded">Render Complete Loaded</div>
		</template>
		<div>Use the buttons to change the size mode.  You must use Resize Configuration for proper rendering.</div>
		<div class="button-container">
			<button class="button" :disabled="command === 'width'" @click="handleWidth">Width (WIDTH)</button>
			<button class="button" :disabled="command === 'height'" @click="handleHeight">Page (HEIGHT)</button>
			<button class="button" :disabled="command === 'scale50'" @click="handleScale50">50% (SCALE)</button>
			<button class="button" :disabled="command === 'scale100'" @click="handleScale100">100% (SCALE)</button>
			<button class="button" :disabled="command === 'scale150'" @click="handleScale150">150% (SCALE)</button>
			<div class="button" style="font-weight: bold">Scale {{ displayScale }}</div>
		</div>
		<div class="error" v-if="errorMessage">{{errorMessage}}</div>
	</div>
	<PdfComponent
		id="my-pdf"
		class="document-container"
		:sizeMode="sizeMode"
		:scale="scale"
		:textLayer="true"
		:annotationLayer="true"
		:resizeConfiguration="calcResize"
		:pageContainerClass="pageContainerClass"
		canvasClass="page-stack"
		annotationLayerClass="page-stack"
		textLayerClass="page-stack"
		@loaded="handleLoaded"
		@load-failed="handleError"
		@rendered="handleRendered"
		@render-failed="handleRenderingFailed"
		@resize-pages="handleResizePages"
		@resize-complete="handleResizeComplete"
		:source="url">
		<template #pre-page="slotProps">
			<div style="text-align:center" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">Page {{slotProps.pageNumber}}</div>
		</template>
	</PdfComponent>
</div>
</template>
<script>
import { PdfComponent } from "../../lib";
import { WIDTH, HEIGHT, SCALE } from "../../lib";
import { ResizeConfiguration, ResizeDynamicConfiguration } from "../../lib";

export default {
	name: "DemoSizeMode",
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
		handleRendered(ev) {
			console.log("handle.rendered", ev);
			if(this.sizeMode === WIDTH || this.sizeMode === HEIGHT) {
				this.scale = ev[0].scale;
			}
			this.renderComplete = true;
		},
		handleRenderingFailed(ev) {
			console.error("handle.render-error", ev);
			this.errorMessage = ev.message;
			this.renderComplete = true;
		},
		handleResizeComplete(ev) {
			console.log("handle.resize-complete", this.command, ev);
			if(this.sizeMode === WIDTH || this.sizeMode === HEIGHT) {
				this.scale = ev[0].page.scale;
			}
			this.renderComplete = true;
		},
		handleResizePages(ev) {
			console.log("handle.resize", this.command, ev);
		},
		handleWidth(ev) {
			this.renderComplete = false;
			this.sizeMode = WIDTH;
			this.scale = undefined;
			this.command = "width";
			this.css = "width";
		},
		handleHeight(ev) {
			this.renderComplete = false;
			this.sizeMode = HEIGHT;
			this.scale = undefined;
			this.command = "height";
			this.css = "height";
		},
		handleScale50(ev) {
			this.renderComplete = false;
			this.sizeMode = SCALE;
			this.scale = 0.5;
			this.command = "scale50";
			this.css = "scale";
		},
		handleScale100(ev) {
			this.renderComplete = false;
			this.sizeMode = SCALE;
			this.scale = 1;
			this.command = "scale100";
			this.css = "scale";
		},
		handleScale150(ev) {
			this.renderComplete = false;
			this.sizeMode = SCALE;
			this.scale = 1.5;
			this.command = "scale150";
			this.css = "scale";
		},
		pageContainerClass(page) {
			return [
				"page-container",
				{
					"page-width": this.sizeMode === WIDTH,
					"page-height": this.sizeMode === HEIGHT,
					"page-scale": this.sizeMode === SCALE
				}
			];
		},
	},
	computed: {
		displayScale() { return this.scale === undefined ? "-" : this.scale.toFixed(2); },
		// IMPORTANT to use the correct element for scrolling!
		// in this case we are using the viewport (NULL)
		calcResize() { return this.dynamicRescale ? ResizeDynamicConfiguration.defaultConfiguration(null, "64px 0px 0px 64px") : ResizeConfiguration.defaultConfiguration(); },
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			sizeMode: WIDTH,
			scale: undefined,
			errorMessage: null,
			css: "width",
			dynamicRescale: true,
			resize: ResizeConfiguration.defaultConfiguration(),
			renderComplete: false,
			command: "width",
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
	width: auto;
}
:deep(.page-width) {
	width: 90vw;
	height: auto;
}
:deep(.page-height) {
	height: 90vh;
	width: auto;
}
:deep(.page-scale) {
	width: auto;
	height: auto;
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
	contain: content;
	transition: width 1s ease-in-out, height 1s ease-in-out, --scale-factor 1s ease-in-out;
}
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width:100%;
}
.button-container {
	width: 50rem;
	margin: auto;
	margin-top: .5rem;
	display: grid;
	grid-auto-flow: row;
	grid-template-rows: repeat(1,1fr);
	grid-template-columns: repeat(6,1fr);
}
.button {
	padding: .2rem;
	justify-self: center;
	align-self:center;
	vertical-align: middle;
}
</style>
