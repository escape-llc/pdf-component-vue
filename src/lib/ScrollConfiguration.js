import { Trigger } from "./Trigger";

class ScrollConfiguration {
	root
	// top,left,right,bottom
	rootMargin
	triggerTime
	/**
	 * Ctor.
	 * @param {DOMElement|undefined} root passed through to IntersectionObserver.ctor.
	 * @param {String} rootMargin CSS format; passed through to IntersectionObserver.ctor.
	 * @param {Number} triggerTime trigger timeout in MS.  Default is 100.
	 */
	constructor(root, rootMargin, triggerTime = 100) {
		if(!Number.isInteger(triggerTime)) throw new Error("triggerTime: must be an integer");
		if(triggerTime <= 0) throw new Error("triggerTime: must be GT zero");
		this.root = root;
		this.rootMargin = rootMargin;
		this.triggerTime = triggerTime;
	}
}

class ScrollTracker extends Trigger {
	active = new Set();
	constructor() { super(); }
	/**
	 * Clear the maps and cancel the trigger task.
	 */
	reset() {
		this.active.clear();
		super.reset();
	}
	/**
	 * Cache the currently known size from IntersectionObserver callbacks.
	 * @param {PageContext} page the page to track.
	 * @param {IntersectionObserverEntry} ex the current info.
	 */
	track(page, ex) {
		//console.log("track", page.id, ex);
		if(ex.isIntersecting) {
			this.active.add(page);
		}
		else {
			this.active.delete(page);
		}
	}
	/**
	 * @callback TrackCallback
	 * @param pages {PageContext[]} the list of pages
	 * @returns {void}
	 */
	/**
	 * Call after processing IntersectionObserver entries.
	 * @param {ScrollConfiguration} config Scroll config.
	 * @param {TrackCallback} cb Use to process the callback when it is triggered.
	 */
	trackComplete(config, cb) {
		this.schedule(config.triggerTime, async () => {
			const pages = [];
			for(let px of this.active.values()) {
				pages.push(px);
			}
			await cb(pages);
		});
	}
}

export { ScrollConfiguration, ScrollTracker }