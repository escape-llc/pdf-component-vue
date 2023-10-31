import { COLD, WARM, HOT, pageZone } from "./PageContext";
/**
 * Functions as an abstract base class for page management implementations.
 */
class PageManagement {
	/**
	 * Perform the business logic to associate a zone with every page.
	 * @param {PageContext[]} pageContexts list of pages.
	 * @returns {{zone: Number, page: PageContext}[]} list of page management information.
	 */
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
	/**
	 * Instruct page management to set zones based on the given index.
	 * @param {number} pageIndex 0-relative page index.  This is the "center" point.
	 * @param {number} hotZone size of HOT zone; UNDEFINED makes all pages HOT.
	 * @param {number} warmZone size of WARM zone; UNDEFINED makes all non-HOT pages WARM.
	 */
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
	/**
	 * Perform the business logic to associate a zone with every page.
	 * @param {PageContext[]} pages list of pages.
	 * @returns {{zone: Number, page: PageContext}[]} list of page management information.
	 */
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
	/**
	 * Instruct page management to make the given inclusive range of pages HOT.
	 * All remaining pages are WARM.
	 * Use this in response to scroll management events.
	 * @param {number} start 0-relative starting index.
	 * @param {number} stop 0-relative ending index.
	 */
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
class PageManagement_Scroll extends PageManagement {
	pageIndex
	pm
	/**
	 * Same as update zones, but also sets the starting tile for rendering.
	 * Use this to page through groups of tiles in a fixed grid.
	 * @param {number} pageIndex 0-relative page index.  This is the "center" point.
	 * @param {PageManagement} pm instance of PageManagement to use for execute().
	 */
	constructor(pageIndex, pm) {
		super();
		if(pageIndex === undefined || pageIndex === null) throw new Error("pageIndex: must be GE zero");
		if(pageIndex < 0) throw new Error("pageIndex: must be GE zero");
		if(!pm) throw new Error("pm: MUST be an instance of PageManagement");
		if(!(pm instanceof PageManagement)) throw new Error("pm: MUST be an instance of PageManagement");
		this.pageIndex = pageIndex;
		this.pm = pm;
	}
	get tileStart() { return this.pageIndex; }
	/**
	 * Delegate to the backing PageManagement.
	 * @param {PageContext[]} pages list of pages.
	 * @returns {{zone: Number, page: PageContext}[]} list of page management information.
	 */
	execute(pages) {
		return this.pm.execute(pages);
	}
}
/**
 * Take the smaller of tileCount and scan.length, starting at pageIndex.
 * @param {Array} scan list of scan results.
 * @param {Number} pageIndex starting index.
 * @param {Number|undefined} tileCount tile count.  if undefined use scan.length.
 * @returns {Array} output list of renderable tiles.
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