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

export default {
	name: "PdfComponent",
	emits: [
		"progress", "password-requested",
		"loaded", "loading-failed",
		"rendered", "rendering-failed",
		"page-click",
		"internal-link-clicked"
	],
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
		textLayer: Boolean,
		annotationLayer: Boolean,
		pageContainerClass: {
			type: [String, Function]
		},
		canvasClass: String,
		textLayerClass: String,
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
				console.log("pageManagement", ov, nv);
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
		 * Loads a PDF document. Defines a password callback for protected
		 * documents.
		 *
		 * NOTE: Ignored if source property is not provided.
		 */
		async load(source) {
			if (!source) {
				return;
			}
			try {
				this.document?.destroy()
				this.document = await this.handler.load(source);
				this.cache = new PageCache(this.linkService);
				this.pageCount = this.document.numPages;
				this.$emit("loaded", this.document);
				materializePages(this.sizeMode, this.id, this.pageCount, this.pageContexts);
				// load start page to get some info for placeholder tiles
				const tiles = this.getTiles();
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
				console.log("after TICK", this.pages);
				// render pages
				await Promise.all(pages.map(async px => { await px.render(this.cache); }));
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
		 * Assign grid coordinates to each tile according to tileDimensions.
		 * [0] rows; [1] columns.
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
		calculatePageClass(page) {
			if(!this.pageContainerClass) return undefined;
			if(this.pageContainerClass instanceof Function) {
				const cx = this.pageContainerClass(page);
				return cx;
			}
			return this.pageContainerClass;
		},
		handlePageClick(ev, page) {
			this.$emit("page-click", {
				id: page.id,
				index: page.index,
				state: page.state,
				pageNumber: page.pageNumber,
				gridRow: page.gridRow,
				gridColumn: page.gridColumn,
				originalEvent: ev
			});
		},
	},
}
</script>
<style scoped></style>