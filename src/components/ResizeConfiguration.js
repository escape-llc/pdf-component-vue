class ResizeConfiguration {
	deltaInline
	deltaBlock
	triggerTime
	/**
	 * Establish resize settings.
	 * The resize logic uses a "deferred" trigger via setTimeout().  This accommodates ResizeObserver behavior.
	 * RO callbacks are accumulated during the trigger interval, and fires once the flow stops.
	 * @param {number} deltaInline PX in Inline direction to tolerate before considering trigger.
	 * @param {number} deltaBlock PX in Block direction to tolerate before considering trigger.
	 * @param {number} triggerTime Update delay in MS; MUST be GT zero to accommodate ResizeObserver behavior.
	 */
	constructor(deltaInline, deltaBlock, triggerTime) {
		if(!Number.isInteger(deltaInline)) throw new Erorr("deltaInline: must be an integer");
		if(!Number.isInteger(deltaBlock)) throw new Erorr("deltaBlock: must be an integer");
		if(!Number.isInteger(triggerTime)) throw new Erorr("triggerTime: must be an integer");
		if(deltaInline < 0) throw new Error("deltaInline: must be GE zero");
		if(deltaBlock < 0) throw new Error("deltaBlock: must be GE zero");
		// this MUST be non-zero because of the way ResizeObserver callbacks can occur
		if(triggerTime <= 0) throw new Error("triggerTime: must be GT zero");
		this.deltaInline = deltaInline;
		this.deltaBlock = deltaBlock;
		this.triggerTime = triggerTime;
	}
	static defaultConfiguration() {
		return new ResizeConfiguration(4, 4, 100);
	}
}
/**
 * ResizeTracker helps with the logic associated with tracking the stream of ResizeObserver callbacks.
 */
class ResizeTracker {
	lastKnown = new Map();
	active = new Map();
	trigger = -1
	constructor() { }
	/**
	 * Clear the maps and cancel the trigger task.
	 */
	reset() {
		this.lastKnown.clear();
		this.active.clear();
		if(this.trigger > -1) {
			clearTimeout(this.trigger);
		}
		this.trigger = -1;
	}
	/**
	 * Cache the currently known size from ResizeObserver callbacks.
	 * @param {PageContext} page the page to track.
	 * @param {ResizeObserverSize} dpsize the current DPI rect.
	 */
	track(page, dpsize) {
		//console.log("track", page.id, dpsize);
		this.active.set(page, dpsize);
	}
	/**
	 * Do the bookkeeping for resize handling.
	 * @param {ResizeConfiguration} config resize config.
	 * @returns {PageContext[]} pages that need a resize refresh.
	 */
	compute(config) {
		const resize = [];
		this.active.forEach((value, key) => {
			if(this.lastKnown.has(key)) {
				const dpsize = this.lastKnown.get(key);
				const db = value.blockSize - dpsize.blockSize;
				const di = value.inlineSize - dpsize.inlineSize;
				//console.log("compute.dxdy", key.id, db, di);
				if(Math.abs(db) > config.deltaBlock || Math.abs(di) > config.deltaInline) {
					// schedule a resize
					resize.push({ target: key, db, di, upsize: db > 0 && di > 0 });
					// new cached size
					this.lastKnown.set(key, value);
				}
			}
			else {
				//console.log("compute.init", key.id);
				this.lastKnown.set(key, value);
			}
		});
		return resize;
	}
	/**
	 * Call after processing ResizeObserver entries.
	 * Manages the async trigger task.  While this is called before the timeout expires, the task is rescheduled.
	 * Callback receives PageContext[] with the pages to refresh; MUST return Promise[].
	 * @param {ResizeConfiguration} config Resize config.
	 * @param {Function(PageContext[])} resizecb Use to process the resize callback when it is triggered.  Receives PageContext[].
	 */
	trackComplete(config, resizecb) {
		if(this.trigger > -1) {
			clearTimeout(this.trigger);
		}
		this.trigger = setTimeout(async () => {
			this.trigger = -1;
			const resize = this.compute(config);
			this.active.clear();
			if(resize.length) {
				await resizecb(resize);
			}
		}, config.triggerTime);
	}
}

export { ResizeConfiguration, ResizeTracker }