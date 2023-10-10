/**
 * Take the outline "destination" and resolve it to a page index (not number).
 * @param {import("pdfjs-dist").PDFDocumentProxy} doc PDF document.
 * @param {import("pdfjs-dist/types/src/display/api").RefProxy} ox PDF outline entry.
 * @returns the page index OR -1 if there was an exception.
 */
async function lookupPage(doc, ox) {
	try {
		if(Array.isArray(ox.dest)) {
			const pidx = await doc.getPageIndex(ox.dest[0]);
			return pidx;
		}
		else {
			const dest = await doc.getDestination(ox.dest);
			const pidx = await doc.getPageIndex(dest[0]);
			return pidx;
		}
	}
	catch(ex) {
		console.error("lookupPage", ox.title, ox.dest, ex.message);
		return -1;
	}
}
/**
 * Take the outline and recursively drill down and build up the outline.
 * @param {import("pdfjs-dist").PDFDocumentProxy} doc PDF document.
 * @param {import("pdfjs-dist/types/src/display/api").RefProxy} ox PDF outline entry.
 * @returns {{ outline: RefProxy, pageIndex: Number, items: Array, error: Exception? }} the page index.
 */
async function unwrapOutlineItem(doc, ox) {
	try {
		const pageIndex = await lookupPage(doc, ox);
		let items = [];
		if(ox.items.length) {
			const outline = await Promise.all(ox.items.map(async oxi => {
				const xx = await unwrapOutlineItem(doc, oxi);
				return xx;
			}));
			items = outline;
		}
		return { outline: ox, pageIndex, items, error: null };
	}
	catch(ex) {
		console.error("unwrapOutlineItem", ox.title, ox.dest, ex.message);
		return { outline: ox, pageIndex: 0, items: null, error: ex };
	}
}
/**
 * Take the document outline, recurisvely traverse it and resolve all pageIndex values.
 * @param {import("pdfjs-dist").PDFDocumentProxy} doc PDF document.
 * @returns {Array} array of top-level outline items.  MAY be empty if no outline is available.
 */
async function unwrapOutline(doc) {
	const ol = await doc.getOutline();
	if(ol) {
		const outline = await Promise.all(ol.map(async ox => {
			const xx = await unwrapOutlineItem(doc, ox);
			return xx;
		}));
		return outline;
	}
	return [];
}

export { unwrapOutline, unwrapOutlineItem, lookupPage }