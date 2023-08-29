import { COLD, pageZone } from "./PageContext";
class PageManagement {
	execute(pageContexts) {
		return undefined;
	}
}
class PageManagement_Default extends PageManagement {
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
const tiles = (scan, pageIndex, tileCount, pageCount) => {
	const list = [];
	let end = tileCount ? tileCount : pageCount;
	for(let ix = 0; ix < end; ix++) {
		if(pageIndex + ix >= scan.length) break;
		if(scan.zone === COLD) continue;
		list.push(scan[pageIndex + ix]);
	}
	return list;
}

export { PageManagement, PageManagement_Default, tiles }