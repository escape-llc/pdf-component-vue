<template>
	<template v-if="!source">
		<h1>Faux Viewer</h1>
		<div class="badge-container">
			<div class="badge badge-header">Sidebar</div>
			<div v-for="bg in badges" class="badge"><span class="badge-name">{{bg.name}}</span><span class="badge-value">{{bg.value}}</span></div>
			<div class="badge badge-header" style="margin-left:1rem">Page</div>
			<div v-for="bg in badges2" class="badge"><span class="badge-name">{{bg.name}}</span><span class="badge-value">{{bg.value}}</span></div>
		</div>
		<input id="demo4-input" type="file" ref="file" style="margin-top:.25rem;margin-bottom:.25rem" @change="handleInput"/>
		<div style="margin-top:1rem;margin-bottom:1rem">Try your luck with PDFs from your local machine.  Page thumbnails on the left use Scroll Management to minimize pages rendered.</div>
		<div>For extra credit, document outline (if present) is displayed on the right, courtesy of <a href="https://github.com/N00ts/vue3-treeview">vue3-treeview</a>.</div>
	</template>
	<template v-if="renderComplete">
		<div v-if="command === 'narrow'" id="demo4-complete-x" class="render-complete">Render Complete Narrow</div>
		<div v-else-if="commandIsScroll" id="demo4-complete-gotopage" class="render-complete">Render Complete Goto Page</div>
		<div v-else class="render-complete" id="demo4-complete-loaded">Render Complete Loaded</div>
	</template>
	<div class="error" v-if="errorMessage">{{errorMessage}}</div>
	<h2 v-if="fileName" class="document-banner">
		<div>{{fileName}}<button class="button" style="margin-left:1rem" @click="handlePrint">Print</button>
		<button class="button" style="margin-left:.25rem" @click="handleClose">Open</button>
		<button v-if="renderComplete" id="demo4-goto-page" class="button" style="margin-left:.25rem" @click="handleGotoPage(14)">Goto Page 14</button>
		</div>
		<div class="document-banner-page">{{ pageCount }} Page(s)</div>
	</h2>
	<div class="main-container">
		<div v-if="source" ref="sidebar" class="sidebar">
			<PdfComponent
				ref="pdf"
				id="pdf-sidebar"
				class="document-container"
				:scrollConfiguration="scroll"
				:pageManagement="sidebarPages"
				:pageContainerClass="pageContainer"
				:usePageLabels="true"
				:commandPort="command"
				canvasClass="page-stack"
				@loaded="handleLoaded"
				@load-failed="handleError"
				@rendered="handleRendered"
				@render-failed="handleRenderingFailed"
				@command-complete="handleCommandComplete"
				@page-click="handlePageClick"
				@visible-pages="handleVisiblePages"
				:source="source">
				<template #pre-page="slotProps">
					<div class="page-number" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">{{slotProps.pageLabel ?? `Page ${slotProps.pageNumber}`}}</div>
				</template>
			</PdfComponent>
		</div>
		<div class="page-view">
			<PdfComponent
				id="pdf-page"
				:textLayer="true"
				:annotationLayer="true"
				:pageManagement="pages"
				:tileConfiguration="tileControl"
				:sizeMode="sizeMode"
				class="document-container2"
				pageContainerClass="page-container2"
				canvasClass="page-stack"
				annotationLayerClass="page-stack"
				textLayerClass="page-stack"
				@load-failed="handleError"
				@rendered="handleRenderedPages"
				@render-failed="handleRenderingFailedPage"
				@internal-link-click="handleInternalLink"
				:source="source2">
				<template #post-page="slotProps">
					<div style="text-align:center;font-weight:bold;" :style="{ 'grid-row': slotProps.gridRow, 'grid-column': slotProps.gridColumn }">{{slotProps.pageLabel}}</div>
				</template>
			</PdfComponent>
		</div>
		<div v-if="outline" class="sidebar">
			<Tree :config="config" :nodes="outline" @nodeFocus="handleOutlineClick"/>
		</div>
	</div>
</template>
<script>
import Tree from "vue3-treeview";
import { PdfComponent, ScrollConfiguration, PageManagement_Scroll, TileConfiguration, COLUMN, HEIGHT, PageManagement_UpdateRange } from "../../lib"
import { unwrapOutline } from "../../lib";
import { Command, PrintDocument, ScrollToPage } from "../../lib";
import "vue3-treeview/dist/style.css";

/**
 * Example of a custom command.
 * Unwrap the document outline, then configure it for the tree view of your choice.
 */
class OutlineTree extends Command {
	async execute(ctx) {
		const outline = await unwrapOutline(ctx.document);
		console.log("OutlineTree", outline);
		// convert to format needed for the tree view
		const nodes = {};
		const config = {
			roots: [],
			padding: 0,
		};
		let symx = 1;
		function processLevel(level, parent) {
			level.forEach(ox => {
				const id = `id${symx++}`;
				const node = {
					text: ox.outline.title,
					pageIndex: ox.pageIndex,
					children: [],
					state: { disabled:false, hidden:false }
				};
				nodes[id] = node;
				parent.children.push(id);
				if(ox.items.length) {
					processLevel(ox.items, node);
				}
			});
		}
		outline.forEach(ox => {
			const id = `id${symx++}`;
			if(ox.error) return;
			const node = { text: ox.outline.title, pageIndex: ox.pageIndex, children:[], state: {disabled:false,hidden:false} };
			nodes[id] = node;
			config.roots.push(id);
			if(ox.items.length) {
				processLevel(ox.items, node);
			}
		});
		return { outline, config, nodes };
	}
}
export default {
	name: "Demo4View",
	components: {PdfComponent, Tree},
	methods: {
		handleLoaded(doc) {
			console.log("sidebar.loaded", doc);
			this.pageCount = doc.numPages;
			this.selectedPage = 1;
			this.scroll = new ScrollConfiguration(this.$refs.sidebar.$el, "64px 0px 0px 64px");
			this.command = new OutlineTree();
		},
		handleError(ev) {
			console.error("handle.load-error", ev);
			this.errorMessage = `Load: ${ev.message}`;
			this.renderComplete = true;
		},
		handleRenderedPages(ev) {
			console.log("page.rendered", ev);
		},
		handleRendered(ev) {
			console.log("sidebar.rendered", ev);
			this.renderComplete = true;
		},
		handleRenderingFailed(ev) {
			console.error("sidebar.render-error", ev);
			this.errorMessage = `Render Sidebar: ${ev.message}`;
			this.renderComplete = true;
		},
		handleRenderingFailedPage(ev) {
			console.error("page.render-error", ev);
			this.errorMessage = `Render Page: ${ev.message}`;
			this.renderComplete = true;
		},
		handleInternalLink(ev) {
			console.log("internal-link-click", ev);
			this.selectedPage = ev.pageNumber;
			if(ev.pageNumber > 0) {
				this.cacheStartPage = ev.pageNumber;
			}
		},
		handleVisiblePages(ev) {
			console.log("visible pages", ev);
			// get page range visible and create a PageManagment instance to fufill it
			const indexes = ev.map(xx => xx.index);
			const min = Math.min(...indexes);
			const max = Math.max(...indexes);
			// pad the region so nearby off-screen pages are rendered
			// this avoids FoUC when clicking the sidebar's scroll bar
			const margin = Math.floor(ev.length/2) + 1;
			this.scrollStart = Math.max(0, min - margin);
			this.scrollStop = Math.min(this.pageCount - 1, max + margin);
		},
		async handlePrint(ev) {
			const print = new PrintDocument();
			this.command = print;
		},
		handleClose(ev) {
			this.source = null;
			this.source2 = null;
			this.cacheStartPage = 1;
		},
		handleInput(ev) {
			this.renderComplete = false;
			const file = ev.target.files[0];
			//Step 1: Read the file using file reader
			const fileReader = new FileReader();
			// we must capture THIS so the ONLOAD callback below can access it
			// the handler binds THIS itself so we cannot use a bind or arrow function
			const capture = this;
			fileReader.onload = function() {
				//Step 3:turn array buffer into typed array
				const u8a = new Uint8Array(this.result);
				// each instance requires a separate copy of the buffer
				capture.source = u8a;
				// this makes a copy, which is necessary
				capture.source2 = new Uint8Array(u8a);
				capture.fileName = file.name;
			};
			fileReader.onerror = function(ee) {
				capture.errorMessage = `FileReader failed ${file.name}`;
				capture.renderComplete = true;
			};
			//Step 2:Read the file as ArrayBuffer
			fileReader.readAsArrayBuffer(file);
		},
		pageContainer(page) {
			return this.calcPageClass(page.pageNumber);
		},
		calcPageClass(pageNumber) {
			const css = ["page-container"];
			if(pageNumber === this.selectedPage) {
				css.push("page-selected");
			}
			return css.join(" ");
		},
		updatePage(pageNumber) {
			this.selectedPage = pageNumber;
			if(pageNumber > 0) {
				this.cacheStartPage = pageNumber;
			}
			this.renderComplete = false;
			// sync the sidebar to this page
			this.command = new ScrollToPage(pageNumber, "smooth", "nearest");
		},
		handlePageClick(ev) {
			console.log("handle.pageClick", ev);
			if(ev.page.pageNumber === this.selectedPage) {
			}
			else {
				this.updatePage(ev.page.pageNumber);
			}
		},
		handleOutlineClick(ev) {
			console.log("handle.outlineClick", ev);
			const pageNumber = ev.pageIndex + 1;
			if(pageNumber === this.selectedPage) {
			}
			else {
				this.updatePage(pageNumber);
			}
		},
		handleCommandComplete(ev) {
			console.log("handleCommandComplete", ev);
			if(ev.command instanceof OutlineTree) {
				if(ev.ok) {
					// put the command result into reactive state
					this.config = ev.result.config;
					if(ev.result.outline.length > 0) {
						this.outline = ev.result.nodes;
					}
					else {
						this.outline = undefined;
					}
				}
				else {
					this.outline = undefined;
				}
			}
		},
		handleGotoPage(page) {
			this.renderComplete = false;
			this.updatePage(page);
		},
	},
	computed: {
		commandIsScroll() {return this.command instanceof ScrollToPage; },
		pages() { return new PageManagement_Scroll(this.cacheStartPage - 1, new PageManagement_UpdateRange(this.cacheStartPage - 1, this.cacheStartPage - 1)); },
		sidebarPages() { return new PageManagement_UpdateRange(this.scrollStart, this.scrollStop); }
	},
	data() {
		return {
			source: null,
			source2: null,
			command: null,
			errorMessage: null,
			renderComplete: false,
			pageCount: undefined,
			fileName: undefined,
			selectedPage: null,
			outline: null,
			config: null,
			cacheStartPage: 1,
			sizeMode: HEIGHT,
			tileControl: new TileConfiguration(COLUMN, 1, 1),
			scroll: undefined,
			scrollStart: 0,
			scrollStop: 4,
			badges: [
				{ name: "size", value:"WIDTH" },
				{ name: "render", value: "CANVAS" },
				{ name: "text-layer", value:"off" },
				{ name: "anno-layer", value:"off" },
				{ name: "page", value:"on" },
				{ name: "resize", value:"off" },
				{ name: "scroll", value:"off" },
				{ name: "tile", value:"off" },
				{ name: "commands", value:"yes" },
				{ name: "slot", value:"pre-page" },
			],
			badges2: [
				{ name: "size", value:"HEIGHT" },
				{ name: "render", value: "CANVAS" },
				{ name: "text-layer", value:"on" },
				{ name: "anno-layer", value:"on" },
				{ name: "page", value:"on" },
				{ name: "resize", value:"off" },
				{ name: "scroll", value:"off" },
				{ name: "tile", value:"1x1" },
				{ name: "slot", value:"post-page" },
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
:deep(.node-text) {
	cursor: pointer;
}
.main-container {
	display: flex;
	flex-direction: row;
	width:calc(100vw - 2rem);
	max-height: 92vh;
	overflow:hidden;
	margin-top: .25rem;
	box-sizing: border-box;
}
.sidebar {
	width: 15rem;
	overflow-y: scroll;
	scroll-snap-type: y proximity;
	scroll-padding: 1.8rem;
	padding-left:1rem;
	padding-right:1rem;
	background: gray;
}
.page-view {
	flex-grow: 1;
	margin-left:auto;
	margin-right:auto;
}
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
	row-gap: .25rem;
	margin: auto;
	margin-bottom: 2rem;
	box-sizing: border-box;
	width: 100%;
	height: auto;
	overflow-y: visible;
}
.document-container2 {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	row-gap: .5rem;
	margin: auto;
	margin-bottom: 2rem;
	box-sizing: border-box;
	width: 100%;
	height: 90vh;
}
/* use grid to stack the layers */
:deep(.page-container) {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr;
	background: transparent;
	margin: auto;
	box-sizing: content-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	width:100%;
	transition: box-shadow .5s ease-in;
	scroll-snap-align: start;
	contain: content;
}
:deep(.page-container2) {
	display: grid;
	grid-template-columns: 100%;
	grid-template-rows: 100%;
	background: transparent;
	margin:auto;
	box-sizing: border-box;
	box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	height: 100%;
	contain: content;
}
:deep(.page-number) {
	text-align:center;
	font-weight:bold;
	margin-top:.25rem;	
}
/* stacks the page layers in the grid cell */
:deep(.page-stack) {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: content-box;
	background: transparent;
	width:100%;
}
:deep(.page-selected) {
	transition: box-shadow .5s ease-in;
	box-shadow: 0 1px 4px 2px rgba(252, 1, 210, 0.25);
}
.button {
	display: inline;
	padding: .25rem;
	vertical-align: middle;
}
.badge-header {
	background-color: transparent;
	font-weight: bold;
	margin-right: .25rem;
}
</style>
