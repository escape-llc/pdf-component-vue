import {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
} from "./PageContext";
import { ROW, COLUMN, TileConfiguration } from "./Tiles";
import { PageManagement, PageManagement_UpdateZones, PageManagement_UpdateRange, PageManagement_Scroll } from "./PageManagement";
import { ScrollConfiguration } from "./ScrollConfiguration";
import { unwrapOutline, unwrapOutlineItem, lookupPage } from "./Utils";
import PdfComponent from "./PdfComponent.vue";
import * as pdf from "pdfjs-dist/build/pdf";

import "../pdf-component-vue.css";

// export the version of PDFJS we are built with
const PdfjsVersion = pdf.version;

export {
	PdfjsVersion,
	PdfComponent,
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	ROW, COLUMN, TileConfiguration,
	ScrollConfiguration,
	unwrapOutline, unwrapOutlineItem, lookupPage,
	PageManagement, PageManagement_UpdateZones, PageManagement_UpdateRange, PageManagement_Scroll
}