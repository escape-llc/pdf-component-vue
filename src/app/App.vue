<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { PdfjsVersion } from "../components"
const version = PdfjsVersion
const pversion = __APP_VERSION__
const dpi = (window.devicePixelRatio || 1).toFixed(2)
</script>
<template>
	<header>
		<nav>
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/demo1">Basic</RouterLink>
			<RouterLink to="/demo2">Navigation</RouterLink>
			<RouterLink to="/demo3">Page Management</RouterLink>
			<RouterLink to="/demo4">Faux Viewer</RouterLink>
			<RouterLink to="/demo5">Resize</RouterLink>
			<RouterLink to="/demosvg">SVG</RouterLink>
			<!--
			<RouterLink to="/democomposition">Composition</RouterLink>
			-->
		</nav>
		<div style="margin-left:1rem">
			<div class="badge" style="margin-right:.25rem">dev {{ pversion }}</div>
			<div class="badge" style="margin-right:.25rem">pdfjs {{ version }}</div>
			<div class="badge">dpr {{ dpi }}</div>
		</div>
	</header>
	<div style="margin-top:2rem">
		<RouterView />
	</div>
</template>
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