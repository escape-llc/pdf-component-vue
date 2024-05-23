import { describe, it, expect } from 'vitest'
import { unwrapOutline } from "../Utils";
import { useOutline, pdfjs } from "./PdfjsMock";

const bogus_outine = [
	{
			"action": null,
			"dest": "Introduction",
			"url": null,
			"title": "Introduction",
			"color": {
					"0": 0,
					"1": 0,
					"2": 0
			},
			"bold": false,
			"italic": false,
			"items": []
	},
	{
			"action": null,
			"dest": "Objects",
			"url": null,
			"title": "Objects",
			"color": {
					"0": 0,
					"1": 0,
					"2": 0
			},
			"count": -3,
			"bold": false,
			"italic": false,
			"items": [
				{
					"action": null,
					"dest": "Objects_section",
					"url": null,
					"title": "Objects Section",
					"items": []
				}
			]
	},
	{
			"action": null,
			"dest": "Evaluation of expressions",
			"url": null,
			"title": "Evaluation of expressions",
			"color": {
					"0": 0,
					"1": 0,
					"2": 0
			},
			"count": -5,
			"bold": false,
			"italic": false,
			"items": []
	},
	{
			"action": null,
			"dest": "Functions",
			"url": null,
			"title": "Functions",
			"color": {
					"0": 0,
					"1": 0,
					"2": 0
			},
			"count": -3,
			"bold": false,
			"italic": false,
			"items": []
	},
	{
			"action": null,
			"dest": "Object-oriented programming",
			"url": null,
			"title": "Object-oriented programming",
			"color": {
					"0": 0,
					"1": 0,
					"2": 0
			},
			"count": -7,
			"bold": false,
			"italic": false,
			"items": []
	},
	{
			"action": null,
			"dest": "Computing on the language",
			"url": null,
			"title": "Computing on the language",
			"color": {
					"0": 0,
					"1": 0,
					"2": 0
			},
			"count": -6,
			"bold": false,
			"italic": false,
			"items": []
	}
];
const outline_map = new Map();
for(let ix = 0; ix < bogus_outine.length; ix++) {
	outline_map.set(bogus_outine[ix].dest, ix);
	if(Array.isArray(bogus_outine[ix].items)) {
		for(let jx = 0; jx < bogus_outine[ix].items.length; jx++) {
			// make all subitems same page
			outline_map.set(bogus_outine[ix].items[jx].dest, ix);
		}
	}
}

describe("Utils", () => {
	it("unwrapOutline no outline", async () => {
		useOutline(undefined);
		const document = await pdfjs.getDocument().promise;
		const outline = await unwrapOutline(document);
		expect(outline).toMatchObject([]);
	})
	it("unwrapOutline outline", async () => {
		useOutline(bogus_outine, outline_map);
		const document = await pdfjs.getDocument().promise;
		const outline = await unwrapOutline(document);
		expect(outline.map(ox => ox.pageIndex)).toMatchObject([0,1,2,3,4,5]);
	})
})