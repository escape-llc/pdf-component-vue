<template>
	<div :id="id" :class="containerClass">
		<template v-for="page in pages" :key="page.pageNumber">
			<slot name="pre-page" v-bind="page"></slot>
			<slot name="page" v-bind="page"></slot>
			<slot name="post-page" v-bind="page"></slot>
		</template>
	</div>
</template>
<script>
import * as pdf from 'pdfjs-dist/build/pdf.js'
import { PDFLinkService } from 'pdfjs-dist/web/pdf_viewer.js'
import { COLD, WARM, HOT,
	PageContext, RenderState, DocumentHandler_pdfjs, materializePages,
} from "./PageContext.js"

import '../pdf-component-vue.css'

pdf.GlobalWorkerOptions.workerSrc = "./pdf.worker.js";

//if (import.meta.env.ENV === 'production') {
//	pdf.GlobalWorkerOptions.workerSrc = "./pdf.worker.js";
//} else {
//	pdf.GlobalWorkerOptions.workerSrc = "../../node_modules/pdfjs-dist/build/pdf.worker.js";
//}

export default {
	name: "PdfComponent",
	emits: [
		"progress", "password-requested", "loaded", "loading-failed",
		"page-rendered", "rendered", "rendering-failed",
		'internal-link-clicked'
	],
	props: {
		id: String,
		source: {
			type: [Object, String, URL, Uint8Array],
			required: false,
		},
		tileDimensions: {
			type: Array,
			validator(value) {
				if(value === null || value === undefined) return true;
				if(Array.isArray(value)) {
					if(value.length !== 2) throw new Error("tileDimensions: array must have 2 elements [rows,columns]");
					return true;
				}
				throw new Error("tileDimensions: must be array of dimension 2");
			}
		},
		hotZone: {
			type: Number,
			validator(value) {
				if(value === null || value === undefined) return true;
				if(value <= 0) throw new Error("hotZone: must be greater than zero");
			}
		},
		warmZone: {
			type: Number,
			validator(value) {
				if(value === null || value === undefined) return true;
				if(value <= 0) throw new Error("hotZone: must be greater than zero");
			}
		},
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
					throw new Error('Rotation must be 0 or a multiple of 90.')
				}
				return true
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
			pageNums: [],
			pages: [],
			pageCount: null,
		}
	},
	computed: {
		linkService() {
			if (!this.document || this.disableAnnotationLayer) {
				return null
			}

			const service = new PDFLinkService()
			service.setDocument(this.document)
			service.setViewer({
				scrollPageIntoView: ({ pageNumber }) => {
					this.$emit('internal-link-clicked', pageNumber)
				},
			})
			return service
		},
	},
	created() {
		// cannot be wrapped!
		this.document = null;
		this.pageContexts = [];
		this.handler = new DocumentHandler_pdfjs(this.$emit);
		this.$watch(
			() => [
				this.source,
				this.disableAnnotationLayer,
				this.disableTextLayer,
				//this.page,
				this.rotation,
			],
			async ([newSource], [oldSource]) => {
				if (newSource !== oldSource) {
					await this.load(newSource);
				}
				await this.renderPages();
			}
		)
	},
	mounted() {
		this.load(this.source)
		.then(_ => { return this.renderPages(); })
		.then(_ => { console.log("it's all done"); });
	},
	beforeDestroy() {
		this.document?.destroy()
		this.document = null;
	},
	beforeUnmount() {
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
				this.pageCount = this.document.numPages;
				// load 1st page to get some info for placeholder tiles
				materializePages(this.id, this.pageCount, this.pageContexts);
				// we got it so it's HOT now
				const page1 = await this.handler.page(1);
				console.log("rotation,page1", this.rotation, page1);
				// size remaining pages
				for(let ix = 0; ix < this.pageContexts.length; ix++) {
					if(ix === 0) {
						this.pageContexts[ix].hot(page1, this.rotation || 0);
					}
					else {
						this.pageContexts[ix].layout(page1);
					}
				}
				// initial load of pages so we get something in the DOM
				const tiles = this.getTiles();
				this.updatePages(tiles);
				this.$emit('loaded', this.document);
			} catch (e) {
				this.document = null;
				this.pageCount = null;
				this.pageNums = [];
				this.$emit('loading-failed', e);
			}
		},
		/**
		 * Assign grid coordinates to each tile according to tileDimensions.
		 * [0] rows; [1] columns.
		 * @param {Array} tiles list of tiles.
		 */
		sequenceTiles(tiles) {
			if(this.tileDimensions) {
				// TODO support both row and column major layouts
				let ix = 0;
				for(let row = 0; row < this.tileDimensions[0]; row++) {
					for(let column = 0; column < this.tileDimensions[1]; column++) {
						tiles[ix++].page.grid(row + 1, column + 1);
					}
				}
			}
		},
		/**
		 * Take the tiles obtain wrappers and update the reactive state.
		 * @param {Array} tiles list of (sequenced) tiles.
		 */
		updatePages(tiles) {
			const pages = [];
			tiles.forEach(tx => {
				pages.push(tx.page.wrapper());
			});
			console.log("updatePages (pages)", pages);
			this.pages = pages;
			return pages;
		},
		/**
		 * Run the tile sequencing and return the list of tiles to render.
		 */
		getTiles() {
			const state = new RenderState(this.pageContexts, this.pageCount, this.page - 1 || 0, this.hotZone, this.warmZone);
			const output = state.scan();
			const tc = this.tileDimensions ? this.tileDimensions[0] * this.tileDimensions[1] : undefined;
			const tiles = state.tiles(output, tc);
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
			const tiles = this.getTiles();
			// start loading HOT pages
			await Promise.all(tiles.filter(tx => tx.zone === HOT).map(async tx => {
				if(tx.page.state !== HOT) {
					console.log("HOT", tx);
					const page = await this.handler.page(tx.page.pageNumber);
					tx.page.hot(page, this.rotation);
				}
			}));
			// final swap-a-roo
			this.updatePages(tiles);
		},
	},
}
</script>
<style scoped>
</style>