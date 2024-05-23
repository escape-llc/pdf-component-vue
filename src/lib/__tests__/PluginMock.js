const pluginContext = (event, sc, rc, pcs, pages) => {
	const emitted = [];
	const pictx = {
		event,
		pageContexts: pcs ?? [],
		pages: pages ?? [],
		$emit: (name,obj) => {console.log("$emit", name, obj); emitted.push({event:name,data:obj}) },
		scrollConfiguration: sc,
		resizeConfiguration: rc,
		emitted,
	};
	return pictx;
}
class MockObserver {
	cb;
	options;
	elements = [];

	constructor(cb, options) {
		this.cb = cb;
		this.options = options;
		this.elements = [];
	}

	unobserve(elem) {
		this.elements = this.elements.filter((en) => en !== elem);
	}

	observe(elem) {
		this.elements = [...new Set(this.elements.concat(elem))];
	}

	disconnect() {
		this.elements = [];
	}

	fire(arr) {
		this.cb(arr, this);
	}
}

export { MockObserver,  pluginContext }