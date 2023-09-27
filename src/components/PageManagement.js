import { COLD, WARM, HOT, pageZone } from "./PageContext";
/**
 * Functions as an abstract base class for page management implementations.
 */
class PageManagement {
	execute(pageContexts) {
		return undefined;
	}
	get tileStart() { return 0; }
}
/**
 * Page management based on HOT/WARM/COLD "zones" centered around a specific page.
 */
class PageManagement_UpdateZones extends PageManagement {
	pageIndex
	hotZone
	warmZone
	constructor(pageIndex, hotZone, warmZone) {
		super();
		if(pageIndex === undefined || pageIndex === null) throw new Error("pageIndex: must be GE zero");
		if(pageIndex < 0) throw new Error("pageIndex: must be GE zero");
		if(hotZone !== undefined && hotZone < 0) throw new Error("hotZone: must be undefined or GE zero");
		if(warmZone !== undefined && warmZone < 0) throw new Error("warmZone: must be undefined or GE zero");
		this.pageIndex = pageIndex;
		this.hotZone = hotZone;
		this.warmZone = warmZone;
	}
	zone(page, count) {
		return pageZone(page.index, this.pageIndex, count, this.hotZone, this.warmZone);
	}
	execute(pages) {
		const list = pages.map(px => { return { zone: this.zone(px, pages.length), page: px }; });
		return list;
	}
}
/**
 * Page management based on explicit page range.
 * Use in (dynamic) scrolling situations to limit resource consumption.
 */
class PageManagement_UpdateRange extends PageManagement {
	start
	stop
	constructor(start, stop) {
		super();
		if(start === undefined || start === null) throw new Error("start: must be GE zero");
		if(start < 0) throw new Error("start: must be GE zero");
		if(stop === undefined || stop === null) throw new Error("stop: must be GE zero");
		if(stop < 0) throw new Error("stop: must be GE zero");
		if(stop < start) throw new Error("stop: must be GE start");
		this.start = start;
		this.stop = stop;
	}
	zone(page) {
		return page.index >= this.start && page.index <= this.stop ? HOT : WARM;
	}
	execute(pages) {
		const list = pages.map(px => { return { zone: this.zone(px), page: px }; });
		return list;
	}
}
/**
 * Page management that sets a starting tile for rendering.
 * Use this to "page" through groups of tiles.
 */
class PageManagement_Scroll extends PageManagement_UpdateZones {
	constructor(pageIndex, hotZone, warmZone) {
		super(pageIndex, hotZone, warmZone);
	}
	get tileStart() { return this.pageIndex; }
}
/**
 * Take the smaller of tileCount and scan.length, starting at pageIndex.
 * @param {Array} scan list of scan results.
 * @param {Number} pageIndex starting index.
 * @param {Number|undefined} tileCount tile count.  if undefined use scan.length.
 * @returns 
 */
const tiles = (scan, pageIndex, tileCount) => {
	const list = [];
	let end = tileCount ? tileCount : scan.length;
	for(let ix = 0; ix < end; ix++) {
		if(pageIndex + ix >= scan.length) break;
		if(scan.zone === COLD) continue;
		list.push(scan[pageIndex + ix]);
	}
	return list;
}

export { PageManagement, PageManagement_UpdateZones, PageManagement_UpdateRange, PageManagement_Scroll, tiles }