<template>
	<div
		ref="container"
		:id="id || page?.id"
		:class="containerClass"
		:style="{'grid-row': page?.gridRow, 'grid-column': page?.gridColumn}"
		@click="handlePageClick"
	>
		<canvas ref="canvas" :class="canvasClass" />
		<template v-if="page && page.textLayer">
			<div ref="textLayer" class="textLayer" style="position:relative" :class="textLayerClass" />
		</template>
		<template v-if="page && page.annotationLayer">
			<div ref="annotationLayer" class="annotationLayer" style="position:relative" :class="annotationLayerClass" />
		</template>
		<slot name="page-overlay" v-bind="page">
		</slot>
	</div>
</template>
<script>
import { COLD, WARM, HOT,
	PageContext, RenderState, DocumentHandler_pdfjs, getPageDimensions, materializePages, pageZone,
	makeViewport
} from "./PageContext.js"

export default {
	name: "PdfPage",
	props: {
		id: String,
		page: Object,
		containerClass: String,
		canvasClass: String,
		textLayerClass: String,
		annotationLayerClass: String,
	},
	emits: ["page-click"],
	async mounted() {
		await this.render();
	},
	created() {
		this.$watch(() => this.page, async (newPage, oldPage) => {
			console.log("watch.page (oldPage,newPage)", oldPage, newPage);
			await this.$nextTick();
			await this.render();
		});
	},
	data() {
		return {
		}
	},
	computed: {
	},
	methods: {
		handlePageClick(ev) {
			if(!this.page) return;
			this.$emit("page-click", {
				id: this.page.id,
				index: this.page.index,
				state: this.page.state,
				pageNumber: this.page.pageNumber,
				gridRow: this.page.gridRow,
				gridColumn: this.page.gridColumn,
				originalEvent: ev
			});
		},
		async render() {
			if(!this.page) return;
			try {
				console.log("render", this.page);
				if(this.page.state === WARM) {
					this.page.placeholder(this.$refs.container, this.$refs.canvas);
				}
				if(this.page.state === HOT) {
					await this.page.render(this.$refs.container, this.$refs.canvas, this.$refs.textLayer, this.$refs.annotationLayer);
				}
			}
			catch(ex) {
				console.error("page.render", ex);
			}
		},
	},
}
</script>
<style scoped>
</style>