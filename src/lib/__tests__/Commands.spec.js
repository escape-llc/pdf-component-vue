import { describe, it, expect } from 'vitest'
import * as cmd from '../Commands'

describe("Commands", () => {
	it("Command", () => {
		const command = new cmd.Command();
		expect(async () => {
			const result = await command.execute(undefined);
		})
		.rejects
		.toThrow(new Error("execute: not implemented"));
	})
	it("ScrollToPage.ctor", () => {
		expect(() => {
			const command = new cmd.ScrollToPage();
		})
		.toThrow(new Error("pageNumber: must be an integer"));
		expect(() => {
			const command = new cmd.ScrollToPage(0);
		})
		.toThrow(new Error("pageNumber: must be GT 0"));
		// NOTE using 'undefined' picks up the default value for the parameter but 'null' does not!
		expect(() => {
			const command = new cmd.ScrollToPage(1, null);
		})
		.toThrow(new Error("behavior: must be one of: smooth,instant,auto"));
		expect(() => {
			const command = new cmd.ScrollToPage(1, undefined, null);
		})
		.toThrow(new Error("block: must be one of: start,center,end,nearest"));
		expect(() => {
			const command = new cmd.ScrollToPage(1, undefined, undefined, null);
		})
		.toThrow(new Error("inline: must be one of: start,center,end,nearest"));
	})
})