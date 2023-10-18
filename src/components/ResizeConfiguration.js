class ResizeConfiguration {
	deltaInline
	deltaBlock
	triggerTime
	triggerOnDownsize = false
	/**
	 * Establish resize settings.
	 * The resize logic uses a "deferred" trigger via setTimeout().  This accommodates ResizeObserver behavior.
	 * RO callbacks are accumulated during the trigger interval, and fires once the flow stops.
	 * @param {number} deltaInline PX in Inline direction to tolerate before considering trigger.
	 * @param {number} deltaBlock PX in Block direction to tolerate before considering trigger.
	 * @param {number} triggerTime Update delay in MS; MUST be GT zero to accommodate ResizeObserver behavior.
	 * @param {boolean} triggerOnDownsize if TRUE re-render when going from larger to smaller size.
	 */
	constructor(deltaInline, deltaBlock, triggerTime, triggerOnDownsize) {
		if(!Number.isInteger(deltaInline)) throw new Erorr("deltaInline: must be an integer");
		if(!Number.isInteger(deltaBlock)) throw new Erorr("deltaBlock: must be an integer");
		if(!Number.isInteger(triggerTime)) throw new Erorr("triggerTime: must be an integer");
		if(deltaInline < 0) throw new Error("deltaInline: must be GE zero");
		if(deltaBlock < 0) throw new Error("deltaBlock: must be GE zero");
		// this MUST be non-zero because of the way ResizeObserver callbacks can occur
		if(triggerTime <= 0) throw new Error("triggerTime: must be GT zero");
		if(triggerOnDownsize !== true && triggerOnDownsize !== false) throw new Error("triggerOnDownsize: must be boolean");
		this.deltaInline = deltaInline;
		this.deltaBlock = deltaBlock;
		this.triggerTime = triggerTime;
		this.triggerOnDownsize = triggerOnDownsize;
	}
	static defaultConfiguration() {
		return new ResizeConfiguration(6, 6, 10, false);
	}
}

export { ResizeConfiguration }