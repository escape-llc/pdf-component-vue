<template>
	<div :id="id" :class="containerClass">
		<template v-for="page in pages" :key="page.index">
			<slot name="pre-page" v-bind="page"></slot>
			<slot name="page" v-bind="page"></slot>
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
	DocumentHandler_pdfjs, materializePages,
} from "./PageContext.js";
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
		"internal-link-clicked"
	],
	props: {
		id: String,
		sizeMode: {
			type: Number,
			default: WIDTH,
		},
		source: {
			type: [Object, String, URL, Uint8Array],
			required: false,
		},
		tileConfiguration: tile.TileConfiguration,
		pageManagement: page.PageManagement,
		/**
		 * Desired ratio of canvas size to document size.
		 * @values Number
		 */
		scale: Number,
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
		 * @values String
		 */
		imageResourcesPath: String,
		containerClass: String,
		textLayer: Boolean,
		annotationLayer: Boolean,
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
				await this.renderPages();
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
			.then(_ => { return this.renderPages(); })
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
				this.document = await this.handler.load(source);
				this.cache = new PageCache(this.linkService);
				this.pageCount = this.document.numPages;
				materializePages(this.cache, this.sizeMode, this.id, this.pageCount, this.pageContexts);
				// TODO initialize zones
				// load start page to get some info for placeholder tiles
				// we got it so it's HOT now
				const startPage = 1;
				const page = await this.handler.page(startPage);
				const rotation = this.rotation || 0;
				// size pages
				this.pageContexts.forEach(pc => {
					pc.layers(this.textLayer, this.annotationLayer);
					this.cache.retain(pc.pageNumber, page);
					if (pc.pageNumber === startPage) {
						pc.hot(rotation);
					}
					else {
						pc.warm(rotation);
					}
				});
				// initial load of pages so we get something in the DOM
				const tiles = this.getTiles();
				this.updatePages(tiles);
				this.$emit("loaded", this.document);
				// on $nextTick all the pages are mounted
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
			const pages = tiles.map(tx => tx.page.wrapper());
			console.log("updatePages (pages)", pages);
			this.pages = pages;
			return pages;
		},
		/**
		 * Run the tile sequencing and return the list of tiles to render.
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
				const rotation = this.rotation || 0;
				const tiles = this.getTiles();
				// start loading HOT pages
				await Promise.all(tiles.filter(tx => tx.zone === HOT && tx.page.state !== HOT).map(async tx => {
					const page = await this.handler.page(tx.page.pageNumber);
					this.cache.retain(tx.page.pageNumber, page);
					tx.page.hot(rotation);
				}));
				// deal with remaining state changes
				tiles.filter(tx => tx.zone !== HOT).filter(tx => tx.zone !== tx.page.state).forEach(tx => {
					console.log("transition new,old", tx.zone, tx.page.state);
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
				// final swap-a-roo
				this.updatePages(tiles);
				this.$emit("rendered", Array.from(tiles));
			}
			catch (e) {
				this.$emit("rendering-failed", e);
			}
		},
	},
}
</script>
<style scoped></style>