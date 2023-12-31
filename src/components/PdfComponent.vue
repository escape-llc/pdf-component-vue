<template>
	<div :id="id">
		<template v-for="page in pages" :key="page.index">
			<slot name="pre-page" v-bind="page.infoFor(undefined)"></slot>
			<div
				:ref="el => { mountContainer(page, el); }"
				:id="page.id"
				:class="calculatePageClass(page)"
				:style="{'grid-row': page.gridRow, 'grid-column': page.gridColumn, 'aspect-ratio': page.aspectRatioReactive }"
				:data-state="page.stateReactive"
				:aria-label="page.pageLabel"
				@click="handlePageClick($event, page)"
			>
				<template v-if="page.stateReactive === 2">
					<canvas v-if="renderMode === 0" :ref="el => { mountCanvas(page, el); }" :class="canvasClass" style="width: calc(var(--scale-factor) * var(--page-width) * 1px); height: calc(var(--scale-factor) * var(--page-height) * 1px)" />
					<svg v-else-if="renderMode === 1" :ref="el => { mountCanvas(page, el); }" :class="canvasClass" style="background-color: white; width: calc(var(--scale-factor) * var(--page-width) * 1px); height: calc(var(--scale-factor) * var(--page-height) * 1px)"></svg>
				</template>
				<template v-else>
					<div :class="canvasClass" style="width: calc(var(--scale-factor) * var(--page-width) * 1px); height: calc(var(--scale-factor) * var(--page-height) * 1px)">&#8203;</div>
				</template>
				<template v-if="page.stateReactive === 2">
					<!-- style attribute is managed with PDFJS -->
					<div v-if="textLayer" :ref="el => { mountTextLayer(page, el); }" class="textLayer" :class="textLayerClass" />
					<div v-if="annotationLayer" :ref="el => { mountAnnotationLayer(page, el); }"  class="annotationLayer" :class="annotationLayerClass" />
				</template>
				<slot name="page-overlay" v-bind="page.infoFor(undefined)"></slot>
			</div>
			<slot name="post-page" v-bind="page.infoFor(undefined)"></slot>
		</template>
	</div>
</template>
<script>
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf.min.js";
import { PDFLinkService } from "pdfjs-dist/web/pdf_viewer.js";
import { normalizeClass } from "vue";
import {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	CANVAS, SVG,
	materializePages,
} from "./PageContext.js";
import { DocumentHandler_pdfjs } from "./DocumentHandler.js";
import { PageCache } from "./PageCache.js";
import * as tile from "./Tiles.js";
import * as page from "./PageManagement";
import * as scroll from "./ScrollConfiguration";
import * as resize from "./ResizeConfiguration";
import * as cmd from "./Commands";
import { ResizePlugin } from "./ResizePlugin";
import { ScrollPlugin } from "./ScrollPlugin";
import "../pdf-component-vue.css";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url);

export default {
	name: "PdfComponent",
	emits: [
		"progress", "password-requested",
		"loaded", "load-failed",
		"rendered", "render-failed",
		"command-complete",
		"visible-pages",
		"resize-pages", "resize-complete",
		"page-click",
		"internal-link-click"
	],
	expose: [],
	props: {
		id: String,
		renderMode: {
			type: Number,
			default: CANVAS,
			validator(value) {
				if (value !== CANVAS && value !== SVG) {
					throw new Error("renderMode must be 0 (CANVAS) or 1 (SVG)");
				}
				return true;
			},
		},
		sizeMode: {
			type: Number,
			default: WIDTH,
			validator(value) {
				if (value !== WIDTH && value !== HEIGHT) {
					throw new Error("sizeMode must be 0 (WIDTH) or 1 (HEIGHT)");
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
		 * Issue a command to the component.
		 */
		commandPort: cmd.Command,
		/**
		 * Desired ratio of canvas size to document size.
		 * @values Number
		 */
		scale: {
			type: Number,
			default: undefined,
			validator(value) {
				if(value === undefined) return true;
				if(value < 0) throw new Error("Scale must be GT 0 or undefined");
				return true;
			}
		},
		/**
		 * Document-level rotation.
		 * Each page MAY be rotated independently; it is combined with this value.
		 */
		rotation: {
			type: Number,
			default: 0,
			validator(value) {
				if (value % 90 !== 0) {
					throw new Error("Rotation must be 0 or a multiple of 90.");
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
			type: [String, Array, Object, Function]
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
		this.pluginList = [new ScrollPlugin(), new ResizePlugin()];
		this.pageContexts = [];
		this.handler = new DocumentHandler_pdfjs(this.$emit);
		this.cache = null;
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
		this.$watch(
			() => this.commandPort,
			(nv, _) => {
				if(nv) {
					// ensure we execute in a new unit of work
					setTimeout(async () => { await this.executeCommand(nv); }, 0);
				}
			}
		)
	},
	mounted() {
		if(this.handler === null) {
			this.handler = new DocumentHandler_pdfjs(this.$emit);
		}
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
		 * Clean up resources.
		 */
		cleanup() {
			this.handler?.destroy();
			this.handler = null;
			this.cleanDocument("cleanup");
		},
		/**
		 * Invoke the Plugin callbacks with error control so one Plugin cannot "crash" the dispatch loop.
		 * @param {String} tag use for error message.
		 * @param {Function} picallback Plugin callback; not NULL.
		 */
		pluginInvoke(tag, picallback) {
			this.pluginList.forEach(pi => {
				try {
					picallback(pi);
				}
				catch(ee) {
					console.error(`${tag}: plugin failed`, ee, pi);
				}
			});
		},
		/**
		 * Reset the state associated with a new document loading.
		 */
		cleanDocument(event) {
			this.pluginInvoke("stop", pi => pi.stop({ event }));
		},
		/**
		 * Manage command execute and emit status.
		 * @param {Command} exe the command to execute.
		 */
		async executeCommand(exe) {
			//console.log("executeCommand", exe);
			try {
				if(!this.handler?.document) throw new Error("executeCommand: no document, command not executed");
				const ctx = new cmd.CommandExecuteContext(this.handler, this.pageContexts);
				const result = await exe.execute(ctx);
				//console.log("commandComplete", result);
				this.$emit("command-complete", { command: exe, ok: true, result });
			}
			catch(ex) {
				//console.error("commandComplete", ex);
				this.$emit("command-complete", { command: exe, ok: false, result: ex });
			}
		},
		/**
		 * Load and initial render of PDF source.
		 *
		 * @param {any} source Source document; see the props for possible data types accepted.
		 */
		async load(source) {
			if (!source || !this.handler) {
				this.rendering = false;
				return;
			}
			this.rendering = true;
			try {
				this.cleanDocument("loaded");
				const document = await this.handler.load(source);
				this.cache = new PageCache(this.linkService, this.imageResourcesPath);
				if(document.numPages <= 0) {
					throw new Error("load: document has no pages");
				}
				this.pageCount = document.numPages;
				this.pageContexts = [];
				materializePages(this.renderMode, this.sizeMode, this.id, this.pageCount, this.pageContexts);
				if(this.usePageLabels && this.handler) {
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
				const pictx = {
					event: "loaded",
					pageContexts: this.pageContexts,
					$emit: this.$emit,
					scrollConfiguration: this.scrollConfiguration,
					resizeConfiguration: this.resizeConfiguration,
				};
				this.pluginInvoke("start", pi => { pi.start(pictx); });
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
					const errors = [];
					await Promise.all(pages.map(async px => {
						try {
							await px.render(this.cache);
						}
						catch(ee) {
							errors.push({ page: px, ee });
						}
					}));
					//errors.length && console.error("load.render.errors", errors);
					this.$emit("rendered", pages.map(px => {
						const obx = px.infoFor(undefined);
						const target = errors.find(ex => ex.page === px);
						obx.error = target ? target.ee : undefined;
						return obx;
					}));
				}
				catch(ee) {
					this.$emit("render-failed", ee);
				}
			} catch (e) {
				this.handler?.destroy();
				this.pageCount = null;
				this.pages = [];
				this.pageContexts = [];
				const pictx = {
					event: "load-failed",
					error: e,
					pageContexts: this.pageContexts,
					$emit: this.$emit,
					scrollConfiguration: this.scrollConfiguration,
					resizeConfiguration: this.resizeConfiguration,
				};
				this.pluginInvoke("stop", pi => { pi.stop(pictx); });
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
		/**
		 * Render the pages based on current position and zones.
		 * HOT tiles are triggered.
		 */
		async renderPages() {
			if (!this.handler?.document) {
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
				const errors = [];
				await Promise.all(tiles.map(async px => {
					try {
						await px.page.render(this.cache);
					}
					catch(ee) {
						errors.push({ page: px.page, ee });
					}
				}));
				//errors.length && console.error("render.errors", errors);
				this.$emit("rendered", tiles.map(px => {
					const obx = px.page.infoFor(undefined);
					const target = errors.find(ex => ex.page === px.page);
					obx.error = target ? target.ee : undefined;
					return obx;
				}));
			}
			catch (ee) {
				this.$emit("render-failed", ee);
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
		 * Handle incoming DOM elements.
		 * @param {PageContext[]} pages list of PageContext.
		 */
		 domConnect(pages) {
			const pictx = {
				pages,
				pageContexts: this.pageContexts,
				cache: this.cache,
				$emit: this.$emit,
				scrollConfiguration: this.scrollConfiguration,
				resizeConfiguration: this.resizeConfiguration,
			};
			this.pluginInvoke("connect", pi => { pi.connect(pictx); });
		},
		/**
		 * Handle outgoing DOM elements.
		 * @param {PageContext[]} pages list of PageContext.
		 */
		domDisconnect(pages) {
			const pictx = {
				pages,
				pageContexts: this.pageContexts,
				cache: this.cache,
				$emit: this.$emit,
				scrollConfiguration: this.scrollConfiguration,
				resizeConfiguration: this.resizeConfiguration,
			};
			this.pluginInvoke("disconnect", pi => { pi.disconnect(pictx); });
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
			const pcv = this.pageContainerClass instanceof Function
				? this.pageContainerClass(page.infoFor(undefined))
				: this.pageContainerClass;
			const pcc2 = normalizeClass(pcv);
			return pcc2;
		},
		/**
		 * Emit the page-click event.
		 * @param {Event} ev click event.
		 * @param {PageContext} page clicked page.
		 */
		handlePageClick(ev, page) {
			this.$emit("page-click", page.infoFor(ev));
		},
	},
}
</script>
<style scoped></style>