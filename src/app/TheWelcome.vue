<script setup>
import { inject } from "vue"
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'
import { pdfjsDistSymbol } from "../lib";
const pdfjs = inject(pdfjsDistSymbol)
const pversion = pdfjs.version
const version = __APP_VERSION__
const dev = !import.meta.env.PROD;
</script>

<template>
	<WelcomeItem>
		<template #icon>
			<DocumentationIcon />
		</template>
		<template #heading>Documentation</template>

		<code style="margin-top:.5rem">npm install pdf-component-vue</code>
		<br/>
		<a style="display:inline-block;margin-top:.5rem" href="https://badge.fury.io/js/pdf-component-vue">
			<img v-if="!dev" src="https://badge.fury.io/js/pdf-component-vue.svg" alt="npm version" height="24">
			<div v-else>Placeholder for NPM version</div>
		</a>
		<br/>
		This project is hosted on <a href="https://github.com/escape-llc/pdf-component-vue">github</a>.
		<br/>
		Go to the project's wiki for
		<a href="https://github.com/escape-llc/pdf-component-vue/wiki" target="_blank" rel="noopener">more information</a>.
		<br/>
		Visit our <a href="https://escape-technology-llc.com/">Home Page</a> for more information about eScape.
	</WelcomeItem>

	<WelcomeItem>
		<template #icon>
			<ToolingIcon />
		</template>
		<template #heading>Tooling</template>

		The NPM package and this demo use
		<a href="https://vitejs.dev/guide/features.html" target="_blank" rel="noopener">Vite</a> for development and bundling.
		<br/>
		We use <a href="https://vitest.dev/">vitest</a> for unit tests and test coverage.
		<br/>
		We use <a href="https://playwright.dev/">playwright</a> for end-to-end tests across multiple browsers.
	</WelcomeItem>

	<WelcomeItem>
		<template #icon>
			<EcosystemIcon />
		</template>
		<template #heading>PDFJS</template>

		This package is no longer bundled with <a href="https://mozilla.github.io/pdf.js/" target="_blank" rel="noopener">pdfjs-dist</a>.
		You are free to bundle any 3.x or 4.x build in your package, via various methods.
		<br/>
		<a style="display:inline-block;margin-top:.5rem" href="https://badge.fury.io/js/pdfjs-dist">
			<img v-if="!dev" src="https://badge.fury.io/js/pdfjs-dist.svg" alt="npm version" height="24">
			<div v-else>Placeholder for PDFJS</div>
		</a>
	</WelcomeItem>

	<WelcomeItem>
		<template #icon>
			<CommunityIcon />
		</template>
		<template #heading>Demo</template>

		This is version <b>{{ version }}</b> of the demo.
		<br/>
		Where possible we use the well-known <a href="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"><i>Tracemonkey</i></a> document. It consists of these use cases:
		<ul>
			<li>Basic scrolling demo.  This the simplest use case of WIDTH mode, loading all the pages in a column.</li>
			<li>Basic tiles demo with paging. This shows a 2x3 grid of tiles in HEIGHT mode, with paging.</li>
			<li>Page Management demo.  This shows all 14 pages, but only the "HOT" pages render.  The "HOT" zone is centered on the page you click.</li>
			<li>Faux viewer using 2 instances of <code>pdf-component-vue</code> in HEIGHT mode, with a local PDF you select.  Thumbnails on the left; click to display the page.
 Document outline is presented on the right, courtesy of the <a href="https://github.com/N00ts/vue3-treeview"><code>vue3-treeview</code></a> component.</li>
			<li>Resize Management demo.  Switch between two different sizes and watch the pages re-render in response.</li>
			<li>SVG Render demo.  Demonstrates the quirky and deprecated SVG rendering of pdfjs v3. Since v4 removed SVG mode, the component falls back to CANVAS rendering.</li>
			<li>Size Mode demo.  Demonstrates the new SCALE size mode, and switching between all 3 size modes.</li>
		</ul>
	</WelcomeItem>

	<WelcomeItem>
		<template #icon>
			<SupportIcon />
		</template>
		<template #heading>Support Us!</template>

		As an open source provider, eScape relies on community backing for its sustainability. You can help!
		<br/>
		<a style="display:inline-block;margin-top:.5rem" href="https://www.paypal.com/donate/?hosted_button_id=G8P9TW4QT6C3U" target="_blank" rel="noopener">
			<img v-if="!dev" alt="Donating" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" style="max-width:128px"/>
			<div v-else>Placeholder for Donating</div>
		</a>
	</WelcomeItem>
</template>
