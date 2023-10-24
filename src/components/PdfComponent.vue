<template>
	<div :id="id">
		<template v-for="page in pages" :key="page.index">
			<slot name="pre-page" v-bind="infoFor(page)"></slot>
			<div
				:ref="el => { mountContainer(page, el); }"
				:id="page.id"
				:class=" calculatePageClass(page)"
				:style="{'grid-row': page.gridRow, 'grid-column': page.gridColumn}"
				:data-state="page.stateReactive"
				@click="handlePageClick($event, page)"
			>
				<canvas :ref="el => { mountCanvas(page, el); }" :class="canvasClass" />
				<template v-if="page.stateReactive === 2">
					<div v-if="textLayer" :ref="el => { mountTextLayer(page, el); }" class="textLayer" style="position:relative" :class="textLayerClass" />
					<div v-if="annotationLayer" :ref="el => { mountAnnotationLayer(page, el); }"  class="annotationLayer" style="position:relative" :class="annotationLayerClass" />
				</template>
				<slot name="page-overlay" v-bind="infoFor(page)"></slot>
			</div>
			<slot name="post-page" v-bind="infoFor(page)"></slot>
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
import * as scroll from "./ScrollConfiguration";
import * as resize from "./ResizeConfiguration";
import '../pdf-component-vue.css';

pdf.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.js", import.meta.url);

function createPrintIframe(container) {
	return new Promise((resolve) => {
		const iframe = document.createElement('iframe');
		iframe.onload = () => resolve(iframe);
		iframe.style.display = "none";
		container.appendChild(iframe);
	});
}
function addPrintStyles(doc, sizeX, sizeY) {
	//console.log("addPrintStyles", sizeX, sizeY);
	const style = doc.createElement('style');
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
			max-height: 100% !important;
			height:100%;
			page-break-after: always;
			page-break-before: avoid;
			page-break-inside: avoid;
		}
	`;
	doc.head.appendChild(style);
	doc.body.style.width = '100%';
}

export default {
	name: "PdfComponent",
	emits: [
		"progress", "password-requested",
		"loaded", "load-failed",
		"rendered", "render-failed",
		"printed", "print-failed",
		"visible-pages",
		"resize-pages",
		"page-click",
		"internal-link-click"
	],
	expose: ["print"],
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
		 * Changes the scroll configuration.
		 * The component emits the 'visibile-pages' event back.
		 * Set this from the @loaded handler, before any DOM elements are created.
		 */
		scrollConfiguration: scroll.ScrollConfiguration,
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
			type: Number,
			default: 0,
			validator(value) {
				if (value % 90 !== 0) {
					throw new Error('Rotation must be 0 or a multiple of 90.');
				}
				return true;
			},
		},
		/**
		 * Whether to use the PDF's page labels to "title" the pages.
		 * Otherwise, use the cardinal page number [1..N].
		 */
		usePageLabels: {
			type: Boolean,
			default: true
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
		 * If not NULL/UNDEFINED, Whether to actively resize the layers via ResizeObserver.
		 */
		resizeConfiguration: resize.ResizeConfiguration,
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
			rendering: false,
		}
	},
	computed: {
		linkService() {
			if (!this.handler?.document || !this.annotationLayer) {
				return null;
			}
			const service = new PDFLinkService();
			service.setDocument(this.handler.document);
			service.setViewer({
				scrollPageIntoView: (ev) => {
					this.$emit("internal-link-click", ev);
				},
			});
			return service;
		},
	},
	created() {
		// cannot be wrapped!
		this.pageContexts = [];
		this.handler = new DocumentHandler_pdfjs(this.$emit);
		this.cache = null;
		this.intersect = null;
		this.resizer = null;
		this.resizeTracker = null;
		this.pageSetIntersect = null;
		// end
		this.$watch(
			() => this.source,
			async (newSource, oldSource) => {
				if (newSource !== oldSource) {
					await this.load(newSource);
				}
			}
		);
		this.$watch(
			() => [
				this.pageManagement,
				this.tileConfiguration,
				this.scale,
				this.rotation,
			], async (nvs, ovs) => {
				await this.renderPages();
			}
		);
	},
	mounted() {
		this.load(this.source)
			.then(_ => { });
	},
	beforeDestroy() {
		this.cleanup();
	},
	beforeUnmount() {
		this.cleanup();
	},
	methods: {
		/**
		 * Render the document to a hidden IFRAME and trigger print dialog.
		 * @param {Number} dpi print DPI; defaults to 300.
		 * @param {Array|undefined} pageSequence array of (1-relative) page numbers to print. Leave undefined for all pages.
		 */
		async print(dpi = 300, pageSequence) {
			if (!this.handler.document) {
				return;
			}
			const printUnits = dpi / 72;
			const styleUnits = 96 / 72;
			try {
				const iframe = await createPrintIframe(window.document.body);
				const closePrint = (ev) => {
					window.document.body.removeChild(iframe);
				};
				iframe.contentWindow.onbeforeunload = closePrint;
				iframe.contentWindow.onafterprint = closePrint;
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
						try {
							const page = await this.handler.page(pageNum);
							const viewport = page.getViewport({ scale: 1, rotation: 0, });
							if (ix === 0) {
								const sizeX = (viewport.width * printUnits) / styleUnits;
								const sizeY = (viewport.height * printUnits) / styleUnits;
								addPrintStyles(iframe.contentWindow.document, sizeX, sizeY);
							}
							const canvas = document.createElement("canvas");
							canvas.width = viewport.width * printUnits;
							canvas.height = viewport.height * printUnits;
							await page.render({
								canvasContext: canvas.getContext("2d"),
								intent: "print",
								transform: [printUnits, 0, 0, printUnits, 0, 0],
								viewport,
							}).promise;
							iframe.contentWindow.document.body.appendChild(canvas);
						}
						catch(e) {
							console.error("print failed", e);
						}
					})
				);
				iframe.contentWindow.print();
				this.$emit("printed", iframe);
			}
			catch(e) {
				this.$emit("print-failed", e);
			}
		},
		/**
		 * Clean up resources.
		 */
		cleanup() {
			this.handler?.destroy();
			this.handler = null;
			this.cleanDocument();
		},
		/**
		 * Reset the state associated with a new document loading.
		 */
		cleanDocument() {
			this.intersect?.disconnect();
			this.intersect = null;
			this.pageSetIntersect = null;
			this.resizer?.disconnect();
			this.resizer = null;
			this.resizeTracker?.reset();
			this.resizeTracker = null;
		},
		/**
		 * Load and initial render of PDF source.
		 *
		 * @param {any} source Source document; see the props for possible data types accepted.
		 */
		async load(source) {
			if (!source) {
				this.rendering = false;
				return;
			}
			this.rendering = true;
			try {
				this.cleanDocument();
				const document = await this.handler.load(source);
				this.cache = new PageCache(this.linkService, this.imageResourcesPath);
				if(document.numPages <= 0) {
					throw new Error("document has no pages");
				}
				this.pageCount = document.numPages;
				this.pageContexts = [];
				materializePages(this.sizeMode, this.id, this.pageCount, this.pageContexts);
				if(this.usePageLabels) {
					const labels = await this.handler.pageLabels();
					if(labels) {
						// assign the page labels to the pages
						//console.log("page-labels", labels);
						const ct = Math.min(labels.length, this.pageContexts.length);
						for(let ix = 0; ix < ct; ix++) {
							this.pageContexts[ix].pageLabel = labels[ix];
						}
					}
				}
				this.$emit("loaded", document);
				try {
					// load start page to get some info for placeholder tiles
					const tiles = this.getTiles();
					const startPage = tiles[0].page.pageNumber;
					const page = await this.handler.page(startPage);
					// warm up the cache
					// this allows WARM pages to have the size of startPage instead of undefined
					tiles.filter(tx => tx.zone !== COLD).forEach(tx => {
						this.cache.retain(tx.page.pageNumber, page);
					});
					await this.transition(tiles);
					const pages = this.updateState(tiles);
					await this.domUpdate();
					await Promise.all(pages.map(async px => { await px.render(this.cache); }));
					this.$emit("rendered", pages.map(px => this.infoFor(px)));
				}
				catch(ee) {
					this.$emit("render-failed", ee);
				}
			} catch (e) {
				this.handler.destroy();
				this.pageCount = null;
				this.pages = [];
				this.pageContexts = [];
				this.$emit("load-failed", e);
			}
			finally {
				this.rendering = false;
			}
		},
		/**
		 * Assign grid coordinates to each tile according to tileConfiguration.
		 * @param {{ zone:Number, page:PageContext }[]} tiles list of tiles.
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
		 * Take the tiles extract PageContexts and update the reactive state.
		 * @param {{ zone:Number, page:PageContext }[]} tiles list of (sequenced) tiles.
		 * @returns {PageContext[]} array of pages.
		 */
		updateState(tiles) {
			const pages = tiles.map(tx => tx.page);
			this.pages = pages;
			return pages;
		},
		/**
		 * Run the page management and tile sequencing and return the list of tiles to render.
		 * @returns {{ zone:Number, page:PageContext }[]} list of updated page zones.
		 */
		getTiles() {
			const pm = this.pageManagement ? this.pageManagement : new page.PageManagement_UpdateZones(0, undefined, undefined);
			const output = pm.execute(this.pageContexts);
			//console.log(`${this.id}.getTiles`, pm, output);
			const tc = this.tileConfiguration && !isNaN(this.tileConfiguration.total) ? this.tileConfiguration.total : undefined;
			const tiles = page.tiles(output, pm.tileStart, tc);
			this.sequenceTiles(tiles);
			return tiles;
		},
		/**
		 * Render the pages based on current position and zones.
		 * HOT tiles are triggered.
		 */
		async renderPages() {
			if (!this.handler.document) {
				return;
			}
			this.rendering = true;
			try {
				const tiles = this.getTiles();
				await this.transition(tiles);
				if(this.pages.length === 0 || tiles[0].page.pageNumber !== this.pages[0].pageNumber) {
					// changing tile sets
					const pages = this.updateState(tiles);
					await this.domUpdate();
				}
				await Promise.all(tiles.map(async tx => { await tx.page.render(this.cache); }));
				this.$emit("rendered", tiles.map(tx => this.infoFor(tx.page)));
			}
			catch (e) {
				this.$emit("render-failed", e);
			}
			finally {
				this.rendering = false;
			}
		},
		/**
		 * Consolidate DOM update logic.
		 */
		async domUpdate() {
			this.domDisconnect(this.pageContexts.filter(px => px.container !== null));
			// "during" $nextTick DOM elements are unmounted/mounted
			await this.$nextTick();
			this.domConnect(this.pageContexts.filter(px => px.container !== null));
		},
		/**
		 * Handle outgoing DOM elements.
		 * @param {PageContext[]} pages list of PageContext.
		 */
		domDisconnect(pages) {
			if(this.resizer) {
				//pages.forEach(px => this.resizer.unobserve(px.container));
				this.resizer.disconnect();
				this.resizeTracker.reset();
			}
			if(this.intersect) {
				//pages.forEach(px => this.intersect.unobserve(px.container));
				this.intersect.disconnect();
				this.pageSetIntersect.clear();
			}
		},
		/**
		 * Ensure the IntersectionObserver is activated if requested.
		 */
		ensureIntersection() {
			if(!this.intersect && this.scrollConfiguration instanceof scroll.ScrollConfiguration) {
				this.intersect = new IntersectionObserver(entries => {
					entries.forEach(ex => {
						const target = this.pageContexts.filter(px => px.container === ex.target);
						if(target.length) {
							if(ex.isIntersecting) {
								this.pageSetIntersect.add(target[0]);
							}
							else {
								this.pageSetIntersect.delete(target[0]);
							}
						}
					});
					const pages = [];
					for(let px of this.pageSetIntersect.values()) {
						pages.push(this.infoFor(px));
					}
					this.$emit("visible-pages", pages);
				}, {
					root: this.scrollConfiguration.root,
					rootMargin: this.scrollConfiguration.rootMargin,
					thresholds: [0, 0.25, 0.50, 0.75, 1.0]
				});
				this.pageSetIntersect = new Set();
			}
		},
		ensureResize() {
			if(!this.resizer && this.resizeConfiguration instanceof resize.ResizeConfiguration) {
				this.resizer = new ResizeObserver(entries => {
					entries.forEach(ex => {
						const target = this.pageContexts.filter(px => px.container === ex.target);
						if(target.length) {
							// track by devicePixelContentBoxSize
							const dpsize = ex.devicePixelContentBoxSize[0];
							this.resizeTracker.track(target[0], dpsize);
						}
					});
					// only trigger if size changes by a threshold, e.g. 1 pixel is not enough of a change
					this.resizeTracker.trackComplete(this.resizeConfiguration, async resize => {
						// potential race due to setTimeout; SHOULD NOT filter any elements!
						const available = resize.filter(rx => rx.target.container);
						if(available.length) {
							// prepare "safe" data for $emit
							const emit = available.map(rx => {
								return { page: this.infoFor(rx.target), di: rx.di, db: rx.db, upsize: rx.upsize, redrawCanvas: rx.upsize };
							});
							// component owner has opportunity to alter the redrawCanvas flags
							this.$emit("resize-pages", emit);
							await Promise.all(available.map(async rx => {
								// redraw according redrawCanvas flag
								const redraw = emit.find(ex => ex.page.id === rx.target.id);
								await rx.target.resize(this.cache, redraw ? redraw.redrawCanvas : rx.upsize);
							}));
						}
					});
				});
				this.resizeTracker = new resize.ResizeTracker();
			}
		},
		/**
		 * Handle incoming DOM elements.
		 * @param {PageContext[]} pages list of PageContext.
		 */
		domConnect(pages) {
			this.ensureIntersection();
			if(this.intersect) {
				pages.forEach(px => this.intersect.observe(px.container));
			}
			this.ensureResize();
			if(this.resizer) {
				pages.forEach(px => this.resizer.observe(px.container));
			}
		},
		/**
		 * Perform zone transitions on the tiles in the list.
		 * @param {{ zone:Number, page:PageContext }[]} tiles list of tiles to process.
		 */
		async transition(tiles) {
			// load turning-HOT pages (!HOT->HOT)
			const rotation = this.rotation || 0;
			await Promise.all(tiles.filter(tx => tx.zone === HOT && tx.page.state !== HOT).map(async tx => {
				const page = await this.handler.page(tx.page.pageNumber);
				this.cache.retain(tx.page.pageNumber, page);
				tx.page.hot(rotation);
			}));
			// deal with remaining state changes
			tiles.filter(tx => tx.zone !== HOT && tx.zone !== tx.page.state).forEach(tx => {
				//console.log("transition new,old", tx.page.id, tx.zone, tx.page.state);
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
			page.mountContainer(el);
		},
		mountCanvas(page, el) {
			page.mountCanvas(el);
		},
		mountTextLayer(page, el) {
			page.mountTextLayer(el);
		},
		mountAnnotationLayer(page, el) {
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
		/**
		 * Emit the page-click event.
		 * @param {Event} ev click event.
		 * @param {PageContext} page clicked page.
		 */
		handlePageClick(ev, page) {
			this.$emit("page-click", this.infoFor(page, ev));
		},
	},
}
</script>
<style scoped></style>