import {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
} from "./PageContext";
import { ROW, COLUMN, TileConfiguration } from "./Tiles";
import { PageManagement, PageManagement_Default } from "./PageManagement";
import PdfComponent from "./PdfComponent.vue";
import PdfPage from "./PdfPage.vue";

import "../pdf-component-vue.css";

export {
	PdfComponent,
	PdfPage,
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	ROW, COLUMN, TileConfiguration,
	PageManagement, PageManagement_Default
}