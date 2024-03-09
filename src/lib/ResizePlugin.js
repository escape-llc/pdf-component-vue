import { Plugin } from "./Plugin";
import * as resize from "./ResizeConfiguration";

class ResizePlugin extends Plugin {
	resizer = null;
	resizeTracker = null;
	resizeIntersect = null;
	resizeTrackerActive = null;
	start(options) {
		//console.log("resize.start", options);
	}
	connect({ pages, resizeConfiguration, pageContexts, cache, $emit }) {
		//console.log("resize.connect", resizeConfiguration);
		this.ensureResize(resizeConfiguration, pageContexts, cache, $emit);
		if(this.resizer) {
			pages.forEach(px => this.resizer.observe(px.container));
		}
		if(this.resizeIntersect) {
			pages.forEach(px => this.resizeIntersect.observe(px.container));
		}
	}
	disconnect({ pages }) {
		//console.log("resize.disconnect", this.resizer, this.resizeIntersect);
		if(this.resizeIntersect) {
			//pages.forEach(px => this.resizeIntersect.unobserve(px.container));
			this.resizeIntersect.disconnect();
			this.resizeTrackerActive = null;
		}
		if(this.resizer) {
			//pages.forEach(px => this.resizer.unobserve(px.container));
			this.resizer.disconnect();
			this.resizeTracker.reset();
		}
	}
	stop(options) {
		//console.log("resize.stop", this.resizer, this.resizeTracker, this.resizeTrackerActive);
		this.resizer?.disconnect();
		this.resizer = null;
		this.resizeTracker?.reset();
		this.resizeTracker = null;
		this.resizeTrackerActive = null;
	}
	/**
	 * Ensure the ResizeObserver and its optional IntersectionObserver are activated if requested.
	 */
	ensureResize(resizeConfiguration, pageContexts, cache, $emit) {
		if(!this.resizer && resizeConfiguration instanceof resize.ResizeConfiguration) {
			if(resizeConfiguration instanceof resize.ResizeDynamicConfiguration) {
				this.resizeIntersect = new IntersectionObserver(entries => {
					entries.forEach(ex => {
						const target = pageContexts.find(px => px.container === ex.target);
						if(target) {
							if(ex.isIntersecting) {
								this.resizeTrackerActive.add(target);
							}
							else {
								this.resizeTrackerActive.delete(target);
							}
						}
					});
				},{
					root: resizeConfiguration.root,
					rootMargin: resizeConfiguration.rootMargin,
					thresholds: [0, 0.25, 0.50, 0.75, 1.0]
				});
			}
			this.resizer = new ResizeObserver(entries => {
				entries.forEach(ex => {
					const target = pageContexts.find(px => px.container === ex.target);
					if(target) {
						// track by devicePixelContentBoxSize or contentBoxSize(webkit)
						const dpsize = "devicePixelContentBoxSize" in ex ? ex.devicePixelContentBoxSize[0] : ex.contentBoxSize[0];
						this.resizeTracker.track(target, dpsize);
					}
				});
				if(this.resizeIntersect) {
					requestAnimationFrame(() => {
						for(let [key,value] of this.resizeTracker.active) {
							if(this.resizeTrackerActive.has(key)) {
								const delta = this.resizeTracker.delta(key);
								if(delta !== null && (Math.abs(delta.db) !== 0 || Math.abs(delta.di) !== 0)) {
									key.resizeSync(cache, value.inlineSize, value.blockSize);
								}
							}
						}
					});
				}
				this.resizeTracker.trackComplete(resizeConfiguration, async resize => {
					// potential race due to setTimeout; SHOULD NOT filter any elements!
					const available = resize.filter(rx => rx.target.container);
					if(available.length) {
						// prepare "safe" data for $emit
						const data = available.map(rx => {
							return { page: rx.target.infoFor(), di: rx.di, db: rx.db, upsize: rx.upsize, redrawCanvas: rx.upsize };
						});
						// component owner has opportunity to alter the redrawCanvas flags
						$emit("resize-pages", data);
						await Promise.all(available.map(async rx => {
							// redraw according redrawCanvas flag
							const redraw = data.find(ex => ex.page.id === rx.target.id);
							await rx.target.resize(cache, redraw ? redraw.redrawCanvas : rx.upsize);
						}));
						// recalc with new scale
						const emit2 = available.map(rx => {
							const match = data.find(ex => ex.page.id === rx.target.id);
							return {
								page: rx.target.infoFor(),
								di: rx.di, db: rx.db,
								upsize: match ? match.upsize : rx.upsize,
								redrawCanvas: match ? match.redrawCanvas : rx.redrawCanvas
							};
						});
						$emit("resize-complete", emit2);
					}
				});
			});
			this.resizeTracker = new resize.ResizeTracker();
			if(this.resizeIntersect) {
				this.resizeTrackerActive = new Set();
			}
		}
	}
}

export { ResizePlugin }