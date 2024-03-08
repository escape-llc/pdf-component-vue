/**
 * Abstract base for trigger-based callbacks (via setTimeout).
 */
class Trigger {
	trigger = -1
	constructor() { }
	/**
	 * Reset the trigger if it was pending.
	 * @virtual
	 */
	reset() {
		if(this.trigger > -1) {
			clearTimeout(this.trigger);
		}
		this.trigger = -1;
	}
	/**
	 * Schedule the trigger.
	 * Manages the async trigger task.  While this is called before the timeout expires, the task is rescheduled.
	 * Callback MAY return Promise[].
	 * @protected
	 * @param {Number} triggerTime timeout value for setTimeout().
	 * @param {Function} triggercb Use to process the callback when it is triggered.
	 */
	schedule(triggerTime, triggercb) {
		if(this.trigger > -1) {
			clearTimeout(this.trigger);
		}
		this.trigger = setTimeout(async () => {
			this.trigger = -1;
			await triggercb();
		}, triggerTime);
	}
}
export { Trigger }