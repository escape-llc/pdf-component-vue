<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { PdfjsVersion } from "../components"
const version = PdfjsVersion
const pversion = __APP_VERSION__
const dpi = (window.devicePixelRatio || 1).toFixed(2)
</script>
<template>
	<header style="margin-bottom:.25rem;margin-top:.25rem">
		<nav>
			<div style="font-weight:bold;margin-right:1rem">
				<span class="badge" style="margin-right:.25rem">DEV {{ pversion }}</span>
				<span class="badge" style="margin-right:.25rem">pdfjs {{ version }}</span>
				<span class="badge">DPR {{ dpi }}</span>
			</div>
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
.badge {
	background-color: grey;
	color: white;
	padding: .1rem .2rem;
	text-align: center;
	border-width: 1px;
	border-radius: .2rem;
	border-color: aliceblue;
}
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