<template>
	<div :id="id">
		<template v-for="page in pages" :key="page.index">
			<slot name="pre-page" v-bind="page"></slot>
			<!-- NOTE: the $el callbacks occur depth-first -->
			<div
				:ref="el => { mountContainer(page, el); }"
				:id="page.id"
				:class=" calculatePageClass(page)"
				:style="{'grid-row': page.gridRow, 'grid-column': page.gridColumn}"
				@click="handlePageClick($event, page)"
			>
				<canvas :ref="el => { mountCanvas(page, el); }" :class="canvasClass" />
				<template v-if="textLayer">
					<div :ref="el => { mountTextLayer(page, el); }" class="textLayer" style="position:relative" :class="textLayerClass" />
				</template>
				<template v-if="annotationLayer">
					<div :ref="el => { mountAnnotationLayer(page, el); }"  class="annotationLayer" style="position:relative" :class="annotationLayerClass" />
				</template>
				<slot name="page-overlay" v-bind="page"></slot>
			</div>
			<slot name="post-page" v-bind="page"></slot>
		</template>
	</div>
</template>
<script>
import * as pdf from 'pdfjs-dist/build/pdf.js';
import { PDFLinkService } from 'pdfjs-dist/web/pdf_viewer.js';
import {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	materializePages,
} from "./PageContext.js";
import { DocumentHandler_pdfjs } from "./DocumentHandler.js";
import { PageCache } from './PageCache.js';
import * as tile from "./Tiles.js";
import * as page from "./PageManagement";

import '../pdf-component-vue.css';

pdf.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.js", import.meta.url);
//pdf.GlobalWorkerOptions.workerSrc = "./pdf.worker.js";

//if (import.meta.env.ENV === 'production') {
//	pdf.GlobalWorkerOptions.workerSrc = "./pdf.worker.js";
//} else {
//	pdf.GlobalWorkerOptions.workerSrc = "../../node_modules/pdfjs-dist/build/pdf.worker.js";
//}
function createPrintIframe(container) {
	return new Promise((resolve) => {
		const iframe = document.createElement('iframe');
		iframe.width = 0;
		iframe.height = 0;
		iframe.style.position = 'absolute';
		iframe.style.top = 0;
		iframe.style.left = 0;
		iframe.style.border = 'none';
		iframe.style.overflow = 'hidden';
		iframe.onload = () => resolve(iframe);
		container.appendChild(iframe);
	});
}
function addPrintStyles(iframe, sizeX, sizeY) {
	const style = iframe.contentWindow.document.createElement('style');
	style.textContent = `
		@page {
			margin: 0;
			size: ${sizeX}pt ${sizeY}pt;
		}
		body {
			margin: 0;
		}
		canvas {
			width: 100%;
			page-break-after: always;
			page-break-before: avoid;
			page-break-inside: avoid;
		}
	`;
	iframe.contentWindow.document.head.appendChild(style);
	iframe.contentWindow.document.body.style.width = '100%';
}

export default {
	name: "PdfComponent",
	emits: [
		"progress", "password-requested",
		"loaded", "loading-failed",
		"rendered", "rendering-failed",
		"printing-failed",
		"page-click",
		"internal-link-clicked"
	],
	expose: ["loadDocument", "print"],
	props: {
		id: String,
		sizeMode: {
			type: Number,
			default: WIDTH,
			validator(value) {
				if (value !== WIDTH && value !== HEIGHT) {
					throw new Error('sizeMode must be 0 (WIDTH) or 1 (HEIGHT)');
				}
				return true;
			},
		},
		/**
		 * Corresponds to whatever you can pass to PDFJS as the source.
		 */
		source: {
			type: [Object, String, URL, Uint8Array],
			required: false,
		},
		/**
		 * Changes the tile configuration.
		 */
		tileConfiguration: tile.TileConfiguration,
		/**
		 * Changes the page management.
		 */
		pageManagement: page.PageManagement,
		/**
		 * Desired ratio of canvas size to document size.
		 * @values Number
		 */
		scale: Number,
		/**
		 * Document-level rotation.
		 * Each page MAY be rotated independently; it is combined with this value.
		 */
		rotation: {
			type: [Number, String],
			default: 0,
			validator(value) {
				if (value % 90 !== 0) {
					throw new Error('Rotation must be 0 or a multiple of 90.');
				}
				return true;
			},
		},
		/**
		 * Path for annotation icons, including trailing slash.
		 */
		imageResourcesPath: String,
		/**
		 * Whether to render the text layer.
		 */
		textLayer: Boolean,
		/**
		 * Whether to render the annotation layer.
		 */
		annotationLayer: Boolean,
		/**
		 * CSS class(es) for each page container.
		 * If using a Function, it receives page-info as a parameter.
		 */
		pageContainerClass: {
			type: [String, Function]
		},
		/**
		 * CSS for the layer to make it "stack" on the other layers.
		 */
		canvasClass: String,
		/**
		 * CSS for the layer to make it "stack" on the other layers.
		 */
		textLayerClass: String,
		/**
		 * CSS for the layer to make it "stack" on the other layers.
		 */
		annotationLayerClass: String,
	},
	data() {
		return {
			pages: [],
			pageCount: null,
		}
	},
	computed: {
		linkService() {
			if (!this.document || !this.annotationLayer) {
				return null;
			}
			const service = new PDFLinkService();
			service.setDocument(this.document);
			service.setViewer({
				scrollPageIntoView: ({ pageNumber }) => {
					this.$emit("internal-link-clicked", pageNumber);
				},
			});
			return service;
		},
	},
	created() {
		// cannot be wrapped!
		this.document = null;
		this.pageContexts = [];
		this.handler = new DocumentHandler_pdfjs(this.$emit);
		this.cache = null;
		// end
		this.$watch(
			() => [
				this.source,
				this.annotationLayer,
				this.textLayer,
				this.rotation,
			],
			async ([newSource], [oldSource]) => {
				if (newSource !== oldSource) {
					await this.load(newSource);
				}
			}
		);
		this.$watch(
			() => this.pageManagement, async (nv, ov) => {
				//console.log("pageManagement", ov, nv);
				await this.renderPages();
			}
		);
	},
	mounted() {
		this.load(this.source)
			.then(_ => { });
	},
	beforeDestroy() {
		this.handler = null;
		this.document?.destroy()
		this.document = null;
	},
	beforeUnmount() {
		this.handler = null;
		this.document?.destroy()
		this.document = null;
	},
	methods: {
		async loadDocument(source) {
			await this.load(source);
		},
		/**
		 * Invoke the print functionality.
		 * @param {Number} dpi print DPI; defaults to 300.
		 * @param {String} filename filename; defaults to empty string.
		 * @param {Generator|undefined} pageSequence generates (1-relative) page numbers to print. Leave undefined for all pages.
		 */
		async print(dpi = 300, filename = "", pageSequence) {
			if (!this.document) {
				return;
			}
			const printUnits = dpi / 72;
			const styleUnits = 96 / 72;
			let container, title;
			try {
				container = document.createElement("div");
				container.style.display = "none";
				window.document.body.appendChild(container);
				const iframe = await createPrintIframe(container);
				const pageNums = [];
				if(pageSequence) {
					for(const px of pageSequence) {
						pageNums.push(px);
					}
				}
				else {
					for(let ix = 1; ix <= this.pageCount; ix++) {
						pageNums.push(ix);
					}
				}
				await Promise.all(
					pageNums.map(async (pageNum, ix) => {
						const page = await this.handler.page(pageNum);
						const viewport = page.getViewport({
							scale: 1,
							rotation: 0,
						});

						if (ix === 0) {
							const sizeX = (viewport.width * printUnits) / styleUnits;
							const sizeY = (viewport.height * printUnits) / styleUnits;
							addPrintStyles(iframe, sizeX, sizeY);
						}

						const canvas = document.createElement("canvas");
						canvas.width = viewport.width * printUnits;
						canvas.height = viewport.height * printUnits;
						container.appendChild(canvas);
						const canvasClone = canvas.cloneNode();
						iframe.contentWindow.document.body.appendChild(canvasClone);

						await page.render({
							canvasContext: canvas.getContext("2d"),
							intent: "print",
							transform: [printUnits, 0, 0, printUnits, 0, 0],
							viewport,
						}).promise;

						canvasClone.getContext("2d").drawImage(canvas, 0, 0);
					})
				);
				if (filename) {
					title = window.document.title;
					window.document.title = filename;
				}
				iframe.contentWindow.focus();
				iframe.contentWindow.print();
			}
			catch(e) {
				this.$emit("printing-failed", e);
			}
			finally {
				if (title) {
					window.document.title = title
				}
				//releaseChildCanvases(container);
				container.parentNode?.removeChild(container);
			}
		},
		/**
		 * Load PDF document.
		 *
		 * @param {any} source Source document; see the props for possible data types accepted.
		 */
		async load(source) {
			if (!source) {
				return;
			}
			try {
				this.document?.destroy()
				this.document = await this.handler.load(source);
				this.cache = new PageCache(this.linkService, this.imageResourcesPath);
				this.pageCount = this.document.numPages;
				this.$emit("loaded", this.document);
				materializePages(this.sizeMode, this.id, this.pageCount, this.pageContexts);
				// load start page to get some info for placeholder tiles
				const tiles = this.getTiles();
				// TODO zero tiles?
				const startPage = tiles[0].page.pageNumber;
				const page = await this.handler.page(startPage);
				// warm up the cache
				// this allows WARM pages to have the size of page 1 instead of undefined
				tiles.filter(tx => tx.zone !== COLD).forEach(tx => {
					this.cache.retain(tx.page.pageNumber, page);
				});
				await this.processTiles(tiles);
				const pages = this.updatePages(tiles);
				// on $nextTick all the pages are mounted
				await this.$nextTick();
				//console.log("after TICK", this.pages);
				// render pages
				await Promise.all(pages.map(async px => { await px.render(this.cache); }));
				// TODO use page wrappers in emit
				this.$emit("rendered", Array.from(tiles));
			} catch (e) {
				this.document = null;
				this.pageCount = null;
				this.pages = [];
				this.pageContexts = [];
				this.$emit("loading-failed", e);
			}
		},
		/**
		 * Assign grid coordinates to each tile according to tileConfiguration.
		 * @param {Array} tiles list of tiles.
		 */
		sequenceTiles(tiles) {
			if (!this.tileConfiguration) return;
			const sequence = this.tileConfiguration.sequence();
			let ix = 0;
			while (ix < tiles.length) {
				const grid = sequence.next();
				if (grid.done) break;
				tiles[ix++].page.grid(grid.value.row + 1, grid.value.column + 1);
			}
		},
		/**
		 * Take the tiles obtain wrappers and update the reactive state.
		 * @param {Array} tiles list of (sequenced) tiles.
		 */
		updatePages(tiles) {
			const pages = tiles.map(tx => tx.page);
			console.log("updatePages (pages)", pages);
			this.pages = pages;
			return pages;
		},
		/**
		 * Run the page management and tile sequencing and return the list of tiles to render.
		 */
		getTiles() {
			const pm = this.pageManagement ? this.pageManagement : new page.PageManagement_UpdateCache(0, undefined, undefined);
			const output = pm.execute(this.pageContexts);
			const tc = this.tileConfiguration && !isNaN(this.tileConfiguration.total) ? this.tileConfiguration.total : undefined;
			const tiles = page.tiles(output, pm.tileStart, tc);
			this.sequenceTiles(tiles);
			console.log("getTiles (output,tiles)", output, tiles);
			return tiles;
		},
		/**
		 * Render the pages based on current position and zones.
		 * HOT tiles are triggered.
		 */
		async renderPages() {
			if (!this.document) {
				return;
			}
			try {
				const tiles = this.getTiles();
				await this.processTiles(tiles);
				if(this.pages.length === 0 || tiles[0].page.pageNumber !== this.pages[0].pageNumber) {
					// changing tile sets
					console.log("renderPages.change-tileset");
					const pages = this.updatePages(tiles);
					// require DOM operations before proceeding
					await this.$nextTick();
				}
				await Promise.all(tiles.map(async px => { await px.page.render(this.cache); }));
				this.$emit("rendered", Array.from(tiles));
			}
			catch (e) {
				this.$emit("rendering-failed", e);
			}
		},
		async processTiles(tiles) {
			// load turning-HOT pages (!HOT->HOT)
			const rotation = this.rotation || 0;
			await Promise.all(tiles.filter(tx => tx.zone === HOT && tx.page.state !== HOT).map(async tx => {
				const page = await this.handler.page(tx.page.pageNumber);
				this.cache.retain(tx.page.pageNumber, page);
				tx.page.hot(rotation);
			}));
			// deal with remaining state changes
			tiles.filter(tx => tx.zone !== HOT).filter(tx => tx.zone !== tx.page.state).forEach(tx => {
				console.log("transition new,old", tx.page.id, tx.zone, tx.page.state);
				switch (tx.zone) {
					case WARM:
						tx.page.warm(rotation);
						break;
					case COLD:
						this.cache.evict(tx.page.pageNumber);
						tx.page.cold();
						break;
				}
			});
		},
		mountContainer(page, el) {
			//console.log("mountContainer", page.id, el?.clientWidth, el?.clientHeight);
			page.mountContainer(el);
		},
		mountCanvas(page, el) {
			//console.log("mountCanvas", page.id, el?.clientWidth, el?.clientHeight);
			page.mountCanvas(el);
		},
		mountTextLayer(page, el) {
			//console.log("mountTextLayer", page.id, el?.clientWidth, el?.clientHeight);
			page.mountTextLayer(el);
		},
		mountAnnotationLayer(page, el) {
			//console.log("mountAnnotationLayer", page.id, el?.clientWidth, el?.clientHeight);
			page.mountAnnotationLayer(el);
		},
		/**
		 * Determine whether and how to use the pageContainerClass.
		 * @param {PageContext} page the page.  only used if pageContainerClass is a Function.
		 */
		calculatePageClass(page) {
			if(!this.pageContainerClass) return undefined;
			if(this.pageContainerClass instanceof Function) {
				const cx = this.pageContainerClass(this.infoFor(page));
				return cx;
			}
			return this.pageContainerClass;
		},
		/**
		 * Create a disconnected wrapper object for the page that is "safe" for external callers.
		 * @param {PageContext} page the source page.
		 * @param {Event} ev original event, if any.
		 */
		infoFor(page, ev) {
			return {
				id: page.id,
				index: page.index,
				state: page.state,
				pageNumber: page.pageNumber,
				gridRow: page.gridRow,
				gridColumn: page.gridColumn,
				originalEvent: ev
			};
		},
		handlePageClick(ev, page) {
			this.$emit("page-click", this.infoFor(page, ev));
		},
	},
}
</script>
<style scoped></style>