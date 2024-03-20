<script setup>
import { inject } from "vue"
import { RouterLink, RouterView } from 'vue-router'
import { pdfjsDistSymbol } from "../lib";

const pdfjs = inject(pdfjsDistSymbol)
const version = pdfjs.version
const pversion = __APP_VERSION__
const dpi = (window.devicePixelRatio || 1).toFixed(2)
</script>
<template>
	<header :data-pdfjs-version="version">
		<nav>
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/demo1">Basic</RouterLink>
			<RouterLink to="/demo2">Navigation</RouterLink>
			<RouterLink to="/demo3">Page Management</RouterLink>
			<RouterLink to="/demo4">Faux Viewer</RouterLink>
			<RouterLink to="/demo5">Resize</RouterLink>
			<RouterLink to="/demosvg">SVG <span v-if="version.startsWith('4.')">Canvas Fallback</span></RouterLink>
			<RouterLink to="/demosize">Size Modes</RouterLink>
			<!--
			<RouterLink to="/democomposition">Composition</RouterLink>
			-->
		</nav>
		<div style="margin-left:1rem">
			<div class="badge" style="margin-right:.25rem"><span class="badge-name">dev</span><span class="badge-value">{{ pversion }}</span></div>
			<div class="badge" style="margin-right:.25rem"><span class="badge-name">pdfjs</span><span class="badge-value">{{ version }}</span></div>
			<div class="badge"><span class="badge-name">dpr</span><span class="badge-value">{{ dpi }}</span></div>
		</div>
	</header>
	<div style="margin-top:2rem">
		<RouterView />
	</div>
</template>
<style>
.badge-container {
	display: flex;
	flex-direction: row;
	align-items: center;
}
.badge {
	font-size: smaller;
	background-color: darkgreen;
	padding: .25rem;
	border-radius: .3rem;
	margin-right: .2rem;
}
.badge-name {
	color: white;
	padding-right: .1rem;
}
.badge-value {
	color: silver;
	padding-left: .1rem;
}
</style>
<style scoped>
.badge {
	display: inline-block;
	background-color: grey;
	color: black;
	padding: .1rem .2rem;
	text-align: center;
	border-radius: .2rem;
	font-size: smaller;
}
header {
	position: fixed;
	z-index: 500;
	background-color: silver;
	top: 0;
	left: 2px;
	display:flex;
	flex-direction: row;
	padding: .25rem;
	margin-left: .25rem;
}
nav {
	display: flex;
	flex-direction: row;
	font-size: 16px;
	align-items: center;
	justify-content: center;
	flex-grow: 1;
}
nav a.router-link-exact-active {
	color: var(--color-text);
}
nav a.router-link-exact-active:hover {
	background-color: transparent;
}
nav a {
	display: inline-block;
	margin-right: 1rem;
}
</style>