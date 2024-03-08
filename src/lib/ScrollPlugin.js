import { Plugin } from "./Plugin";
import * as scroll from "./ScrollConfiguration";

class ScrollPlugin extends Plugin {
	intersect = null;
	intersectTracker = null;
	start(options) {
		//console.log("scroll.start", options);
	}
	connect({ pages, scrollConfiguration, pageContexts, $emit }) {
		//console.log("scroll.connect", scrollConfiguration);
		this.ensureIntersection(scrollConfiguration, pageContexts, $emit);
		if(this.intersect) {
			pages.forEach(px => this.intersect.observe(px.container));
		}
	}
	disconnect({ pages }) {
		//console.log("scroll.disconnect", this.intersect);
		if(this.intersect) {
			//pages.forEach(px => this.intersect.unobserve(px.container));
			this.intersect.disconnect();
			this.intersectTracker.reset();
		}
	}
	stop(options) {
		//console.log("scroll.stop", this.intersect, this.intersectTracker);
		this.intersect?.disconnect();
		this.intersect = null;
		this.intersectTracker?.reset();
		this.intersectTracker = null;
	}
	/**
	 * Ensure the IntersectionObserver is activated if requested.
	 */
	ensureIntersection(scrollConfiguration, pageContexts, $emit) {
		if(!this.intersect && scrollConfiguration instanceof scroll.ScrollConfiguration) {
			this.intersect = new IntersectionObserver(entries => {
				entries.forEach(ex => {
					const target = pageContexts.find(px => px.container === ex.target);
					if(target) {
						this.intersectTracker.track(target, ex);
					}
				});
				this.intersectTracker.trackComplete(scrollConfiguration, isect => {
					// potential race due to setTimeout; SHOULD NOT filter any elements!
					const available = isect.filter(ix => ix.container);
					if(available.length) {
						$emit("visible-pages", available.map(ix => ix.infoFor(undefined)));
					}
				});
			}, {
				root: scrollConfiguration.root,
				rootMargin: scrollConfiguration.rootMargin,
				thresholds: [0, 0.25, 0.50, 0.75, 1.0]
			});
			this.intersectTracker = new scroll.ScrollTracker();
		}
	}
}

export { ScrollPlugin }