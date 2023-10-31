import { Trigger } from "./Trigger";

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
		if(!Number.isInteger(deltaInline)) throw new Error("deltaInline: must be an integer");
		if(!Number.isInteger(deltaBlock)) throw new Error("deltaBlock: must be an integer");
		if(!Number.isInteger(triggerTime)) throw new Error("triggerTime: must be an integer");
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
class ResizeTracker extends Trigger {
	lastKnown = new Map();
	active = new Map();
	constructor() { super(); }
	/**
	 * Clear the maps and cancel the trigger task.
	 * @override
	 */
	reset() {
		this.lastKnown.clear();
		this.active.clear();
		super.reset();
	}
	/**
	 * Cache the currently known size from ResizeObserver callbacks.
	 * @param {PageContext} page the page to track.
	 * @param {ResizeObserverSize} dpsize the current DPI rect.
	 */
	track(page, dpsize) {
		this.active.set(page, dpsize);
	}
	/**
	 * Do the bookkeeping for resize handling.
	 * @param {ResizeConfiguration} config resize config.
	 * @returns {{target: PageContext, db: Number, di: Number, upsize: Boolean }[]} pages that need a resize refresh.
	 */
	compute(config) {
		const resize = [];
		this.active.forEach((value, key) => {
			if(this.lastKnown.has(key)) {
				const dpsize = this.lastKnown.get(key);
				const db = value.blockSize - dpsize.blockSize;
				const di = value.inlineSize - dpsize.inlineSize;
				if(Math.abs(db) > config.deltaBlock || Math.abs(di) > config.deltaInline) {
					// schedule a resize
					resize.push({ target: key, db, di, upsize: db > 0 && di > 0 });
					// new cached size
					this.lastKnown.set(key, value);
				}
			}
			else {
				this.lastKnown.set(key, value);
			}
		});
		return resize;
	}
	/**
	 * @callback TrackCallback
	 * @param pages {{target: PageContext, db: Number, di: Number, upsize: Boolean }[]} the list of pages
	 * @returns {void}
	 */
	/**
	 * Call after processing ResizeObserver entries.
	 * @param {ResizeConfiguration} config Resize config.
	 * @param {TrackCallback} cb Use to process the resize callback when it is triggered.
	 */
	trackComplete(config, cb) {
		this.schedule(config.triggerTime, async () => {
			const pages = this.compute(config);
			this.active.clear();
			await cb(pages);
		});
	}
}

export { ResizeConfiguration, ResizeTracker }