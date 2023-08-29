<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>
<template>
	<header style="margin:2rem">
		<nav>
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/demo1">Scrolling</RouterLink>
			<RouterLink to="/demo2">Navigation</RouterLink>
			<RouterLink to="/demo3">Page Management</RouterLink>
			<RouterLink to="/demo4">Load Your Own PDF</RouterLink>
		</nav>
	</header>
	<div>
		<RouterView />
	</div>
</template>
<style scoped>
header {
	line-height: 1.5;
	max-height: 100vh;
}
nav {
	display:flex;
	flex-direction: row;
	width: 100%;
	font-size: 16px;
	text-align: center;
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
<style>
.page-stack {
	grid-area: 1 / 1 / 1 / 1 !important;
	box-sizing: border-box;
	background: transparent;
	width:100%;
}
</style>