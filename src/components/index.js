import {
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
} from "./PageContext";
import { ROW, COLUMN, TileConfiguration } from "./Tiles";
import { PageManagement, PageManagement_UpdateCache, PageManagement_Scroll } from "./PageManagement";
import PdfComponent from "./PdfComponent.vue";

import "../pdf-component-vue.css";

export {
	PdfComponent,
	COLD, WARM, HOT,
	WIDTH, HEIGHT,
	ROW, COLUMN, TileConfiguration,
	PageManagement, PageManagement_UpdateCache, PageManagement_Scroll
}