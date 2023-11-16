import {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
} from "./PageContext";
import { ROW, COLUMN, TileConfiguration } from "./Tiles";
import { PageManagement, PageManagement_UpdateZones, PageManagement_UpdateRange, PageManagement_Scroll } from "./PageManagement";
import { ScrollConfiguration } from "./ScrollConfiguration";
import { ResizeConfiguration } from "./ResizeConfiguration";
import { Command, ScrollToPage, PrintDocument } from "./Commands";
import { unwrapOutline, unwrapOutlineItem, lookupPage } from "./Utils";
import PdfComponent from "./PdfComponent.vue";
import { version } from "pdfjs-dist/build/pdf.js";

import "../pdf-component-vue.css";

// export the version of PDFJS we are built with
const PdfjsVersion = version;

export {
	PdfjsVersion,
	PdfComponent,
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	ROW, COLUMN, TileConfiguration,
	ScrollConfiguration,
	ResizeConfiguration,
	Command, ScrollToPage, PrintDocument,
	unwrapOutline, unwrapOutlineItem, lookupPage,
	PageManagement, PageManagement_UpdateZones, PageManagement_UpdateRange, PageManagement_Scroll
}