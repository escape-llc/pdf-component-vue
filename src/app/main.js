import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { usePdfjs } from '../lib'

const app = createApp(App)

// PDFJS v3 must configure like this
/*
import * as pdfjs from "pdfjs-dist/build/pdf.min.js";
import * as viewer from "pdfjs-dist/web/pdf_viewer.js";
const bundle_v3 = {
	pdfjs,
	viewer,
	workerSrc: new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url)
}
*/

const worker_url = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);
// PDFJS v4 must configure like this
// import modules from the local bundle
const bundle_v4 = {
	pdfjs: await import(/* @vite-ignore */new URL("pdfjs-dist/build/pdf.min.mjs", import.meta.url)),
	viewer: await import(/* @vite-ignore */new URL("pdfjs-dist/web/pdf_viewer.mjs", import.meta.url)),
	//workerSrc: worker_url
}
// PDFJS 4.0.x allows a URL as the workerSrc
//bundle_v4.pdfjs.GlobalWorkerOptions.workerSrc = worker_url;
// PDFJS 4.2.x now enforces a STRING as the workerSrc
bundle_v4.pdfjs.GlobalWorkerOptions.workerSrc = worker_url.toString();
/*
// import v4 modules from a CDN
const unpkg_v4 = {
	pdfjs: await import("https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.min.mjs"),
	viewer: await import("https://unpkg.com/pdfjs-dist@4.0.379/web/pdf_viewer.mjs"),
	workerSrc: "https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs"
}
*/

// provide PDFJS modules to the Application
usePdfjs(app, bundle_v4)

app.use(router)
app.mount('#app')
