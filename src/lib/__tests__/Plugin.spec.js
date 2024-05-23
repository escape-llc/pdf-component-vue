import { describe, it, expect } from 'vitest'
import * as plugin from '../Plugin'

describe("Plugins", () => {
	it("Base class throws all methods", () => {
		const pu = new plugin.Plugin();
		expect(() => {
			pu.start(undefined);
		})
		.toThrow(new Error("start: not implemented"));
		expect(() => {
			pu.connect(undefined);
		})
		.toThrow(new Error("connect: not implemented"));
		expect(() => {
			pu.disconnect(undefined);
		})
		.toThrow(new Error("disconnect: not implemented"));
		expect(() => {
			pu.stop(undefined);
		})
		.toThrow(new Error("stop: not implemented"));
	})
})