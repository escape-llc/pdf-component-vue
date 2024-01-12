import {
	COLD, WARM, HOT,
	WIDTH, HEIGHT, SCALE,
} from "./PageContext";
import { ROW, COLUMN, TileConfiguration } from "./Tiles";
import { PageManagement, PageManagement_UpdateZones, PageManagement_UpdateRange, PageManagement_Scroll } from "./PageManagement";
import { ScrollConfiguration } from "./ScrollConfiguration";
import { ResizeConfiguration, ResizeDynamicConfiguration } from "./ResizeConfiguration";
import { Command, ScrollToPage, PrintDocument } from "./Commands";
import { unwrapOutline, unwrapOutlineItem, lookupPage } from "./Utils";
import PdfComponent from "./PdfComponent.vue";
import { version } from "pdfjs-dist/build/pdf.min.js";

import "../pdf-component-vue.css";

// export the version of PDFJS we are built with
const PdfjsVersion = version;

export {
	PdfjsVersion,
	PdfComponent,
	COLD, WARM, HOT,
	WIDTH, HEIGHT, SCALE,
	ROW, COLUMN, TileConfiguration,
	ScrollConfiguration,
	ResizeConfiguration, ResizeDynamicConfiguration,
	Command, ScrollToPage, PrintDocument,
	unwrapOutline, unwrapOutlineItem, lookupPage,
	PageManagement, PageManagement_UpdateZones, PageManagement_UpdateRange, PageManagement_Scroll
}