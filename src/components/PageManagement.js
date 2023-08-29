import { COLD, pageZone } from "./PageContext";
class PageManagement {
	execute(pageContexts) {
		return undefined;
	}
	get tileStart() { return 0; }
}
class PageManagement_UpdateCache extends PageManagement {
	pageIndex
	hotZone
	warmZone
	constructor(pageIndex, hotZone, warmZone) {
		super();
		this.pageIndex = pageIndex;
		this.hotZone = hotZone;
		this.warmZone = warmZone;
	}
	zone(page, count) {
		return pageZone(page.index, this.pageIndex, count, this.hotZone, this.warmZone);
	}
	execute(pageContexts) {
		const list = pageContexts.map(px => { return { zone: this.zone(px, pageContexts.length), page: px }; });
		return list;
	}
}
class PageManagement_Scroll extends PageManagement_UpdateCache {
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

export { PageManagement, PageManagement_UpdateCache, PageManagement_Scroll, tiles }