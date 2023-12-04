<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { PdfjsVersion } from "../components"
const version = PdfjsVersion
const pversion = __APP_VERSION__
</script>
<template>
	<header style="margin-bottom:.25rem;margin-top:.25rem">
		<nav>
			<div style="font-weight:bold;margin-right:1rem">DEV {{ pversion }} (pdfjs {{ version }})</div>
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/demo1">Basic</RouterLink>
			<RouterLink to="/demo2">Navigation</RouterLink>
			<RouterLink to="/demo3">Page Management</RouterLink>
			<RouterLink to="/demo4">Faux Viewer</RouterLink>
			<RouterLink to="/demo5">Resize</RouterLink>
			<!--
			<RouterLink to="/demo6">Composition</RouterLink>
			-->
		</nav>
	</header>
	<div>
		<RouterView />
	</div>
</template>
<style scoped>
header {
	line-height: 1.5;
}
nav {
	display:flex;
	flex-direction: row;
	width: 100%;
	font-size: 16px;
	align-items: center;
	justify-content: center;
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