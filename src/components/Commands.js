/**
 * Base of commands.
 */
class Command {
	/**
	 * Execute the command.
	 * MAY return a promise.
	 * @param {CommandExecuteContext} ctx command context.
	 */
	async execute(ctx) {
		throw new Error("execute: not implemented");
	}
}
/**
 * Command execute context.
 */
class CommandExecuteContext {
	#handler
	#pages
	/**
	 * Ctor.
	 * @param {DocumentHandler} handler the document handler.
	 * @param {PageContext[]} pages the list of pages.
	 */
	constructor(handler, pages) {
		this.#handler = handler;
		this.#pages = pages;
	}
	get document() { return this.#handler.document; }
	get pageCount() { return this.#handler.document.numPages; }
	async page(pageNumber) {
		const page = await this.#handler.page(pageNumber);
		return page;
	}
	info(pageNumber) {
		const page = this.#pages.find(px => px.pageNumber === pageNumber);
		if(page) {
			return page.infoFor(undefined);
		}
		return undefined;
	}
	container(pageNumber) {
		const page = this.#pages.find(px => px.pageNumber === pageNumber);
		if (page) {
			return page.container;
		}
		return undefined;
	}
}
const alignment = ["start", "center", "end", "nearest"];
const animate = ["smooth", "instant", "auto"];
/**
 * Scroll page container element into view.
 */
class ScrollToPage extends Command {
	pageNumber
	options
	constructor(pageNumber, behavior = "auto", block = "start", inline = "nearest") {
		super();
		if (!behavior || animate.indexOf(behavior) === -1) throw new Error(`behavior: must be one of: ${animate.join(",")}`);
		if (!block || alignment.indexOf(block) === -1) throw new Error(`block: must be one of: ${alignment.join(",")}`);
		if (!inline || alignment.indexOf(inline) === -1) throw new Error(`inline: must be one of: ${alignment.join(",")}`);
		this.pageNumber = pageNumber;
		this.options = { behavior, block, inline };
	}
	async execute(ctx) {
		const el = ctx.container(this.pageNumber);
		if (el) {
			el.scrollIntoView(this.options);
		}
		else {
			throw new Error(`ScrollToPage: element not found; page ${this.pageNumber}`);
		}
	}
}
function createPrintIframe(container) {
	return new Promise(resolve => {
		const iframe = document.createElement("iframe");
		iframe.onload = () => resolve(iframe);
		iframe.style.display = "none";
		container.appendChild(iframe);
	});
}
function addPrintStyles(doc, sizeX, sizeY) {
	//console.log("addPrintStyles", sizeX, sizeY);
	const style = doc.createElement("style");
	style.textContent = `
		@page {
			margin: 0;
			size: ${sizeX}pt ${sizeY}pt;
		}
		body {
			margin: 0;
		}
		canvas {
			width: 100%;
			max-height: 100% !important;
			height:100%;
			page-break-after: always;
			page-break-before: avoid;
			page-break-inside: avoid;
		}
	`;
	doc.head.appendChild(style);
	doc.body.style.width = "100%";
}
class PrintDocument extends Command {
	pageSequence
	dpi
	/**
	 * 
	 * @param {Number[]|undefined} pageSequence list of page numbers or undefined for all pages.
	 * @param {Number} dpi DPI to print at; default is 300.
	 */
	constructor(pageSequence, dpi = 300) {
		super();
		this.pageSequence = pageSequence;
		this.dpi = dpi;
	}
	async execute(ctx) {
		const printUnits = this.dpi / 72;
		const styleUnits = 96 / 72;
		const iframe = await createPrintIframe(window.document.body);
		const closePrint = _ => {
			window.document.body.removeChild(iframe);
		};
		iframe.contentWindow.onbeforeunload = closePrint;
		iframe.contentWindow.onafterprint = closePrint;
		const pageNums = [];
		if (this.pageSequence) {
			for (const px of this.pageSequence) {
				pageNums.push(px);
			}
		}
		else {
			for (let ix = 1; ix <= ctx.pageCount; ix++) {
				pageNums.push(ix);
			}
		}
		const results = await Promise.all(
			pageNums.map(async (pageNum, ix) => {
				try {
					const page = await ctx.page(pageNum);
					const viewport = page.getViewport({ scale: 1, rotation: 0, });
					if (ix === 0) {
						const sizeX = (viewport.width * printUnits) / styleUnits;
						const sizeY = (viewport.height * printUnits) / styleUnits;
						addPrintStyles(iframe.contentWindow.document, sizeX, sizeY);
					}
					const canvas = document.createElement("canvas");
					canvas.width = viewport.width * printUnits;
					canvas.height = viewport.height * printUnits;
					await page.render({
						canvasContext: canvas.getContext("2d"),
						intent: "print",
						transform: [printUnits, 0, 0, printUnits, 0, 0],
						viewport,
					}).promise;
					iframe.contentWindow.document.body.appendChild(canvas);
					return null;
				}
				catch (error) {
					console.error(`print failed page ${pageNum}`, error);
					return { pageNum, error };
				}
			})
		);
		iframe.contentWindow.print();
		return { iframe, errors: results.filter(rx => rx !== null) };
	}
}

export { Command, CommandExecuteContext, ScrollToPage, PrintDocument }