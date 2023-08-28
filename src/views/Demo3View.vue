<script>
import PdfComponent from '../components/PdfComponent.vue'
import PdfPage from '../components/PdfPage.vue'
import { WIDTH, HEIGHT } from '../components/PageContext';

export default {
	name: "Demo3View",
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
		handlePageClick(ev) {
			console.log("handle.pageClick", ev);
			if(ev.pageNumber === this.selectedPage) {
				this.selectedPage = undefined;
			}
			else {
				this.selectedPage = ev.pageNumber;
			}
		},
		pageContainer(page) {
			const css = ["page-container"];
			if(page.pageNumber === this.selectedPage) {
				css.push("page-selected");
			}
			return css.join(" ");
		}
	},
	data() {
		return {
			url: "/tracemonkey.pdf",
			errorMessage: null,
			currentPage: 1,
			sizeMode: HEIGHT,
			selectedPage: null,
		};
	}
}
</script>
<template>
	<h1>Page Management Demo</h1>
	<div v-if="errorMessage">{{errorMessage}}</div>
	<PdfComponent
		id="my-pdf"
		:textLayer="true"
		:annotationLayer="true"
		:sizeMode="sizeMode"
		:tileDimensions="[4,4]"
		:hotZone="3"
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
					:containerClass="pageContainer(slotProps)"
					canvasClass="page-stack"
					annotationLayerClass="page-stack"
					textLayerClass="page-stack"
					@page-click="handlePageClick"
				>
			</PdfPage>
		</template>
	</PdfComponent>
</template>
<style scoped>
/* use grid for sequence of pages */
/* use a containing element to provide the scrolling */
.document-container {
	display: grid;
	grid-template-columns: repeat(4,1fr);
	grid-template-rows: repeat(4,1fr);
	row-gap: .5rem;
	column-gap: .5rem;
	height: 80vh;
	width: 80vw;
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
	height: 100%;
}
.page-selected {
	border: 2px solid magenta;
}
</style>
