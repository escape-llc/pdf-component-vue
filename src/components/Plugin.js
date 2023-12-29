class Plugin {
	start(options) {
		throw new Error("start: not implemented");
	}
	connect(options) {
		throw new Error("connect: not implemented");
	}
	disconnect(options) {
		throw new Error("disconnect: not implemented");
	}
	stop(options) {
		throw new Error("stop: not implemented");
	}
}

export { Plugin };