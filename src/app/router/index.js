import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView
		},
		{
			path: '/demo1',
			name: 'demo1',
			component: () => import('../views/Demo1View.vue')
		},
		{
			path: '/demo2',
			name: 'demo2',
			component: () => import('../views/Demo2View.vue')
		},
		{
			path: '/demo3',
			name: 'demo3',
			component: () => import('../views/Demo3View.vue')
		},
		{
			path: '/demo4',
			name: 'demo4',
			component: () => import('../views/Demo4View.vue')
		},
		{
			path: '/demo5',
			name: 'demo5',
			component: () => import('../views/Demo5View.vue')
		},
		{
			path: '/demosvg',
			name: 'demosvg',
			component: () => import('../views/DemoSvgView.vue')
		},
		{
			path: '/demosize',
			name: 'demosize',
			component: () => import('../views/DemoSizeMode.vue')
		},
		{
			path: '/demo6',
			name: 'demo6',
			component: () => import('../views/DemoCompositionView.vue')
		}
	]
})

export default router