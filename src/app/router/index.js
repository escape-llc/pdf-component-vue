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
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import('../views/Demo1View.vue')
		},
		{
			path: '/demo2',
			name: 'demo2',
			// route level code-splitting
			component: () => import('../views/Demo2View.vue')
		},
		{
			path: '/demo3',
			name: 'demo3',
			// route level code-splitting
			component: () => import('../views/Demo3View.vue')
		},
		{
			path: '/demo4',
			name: 'demo4',
			// route level code-splitting
			component: () => import('../views/Demo4View.vue')
		},
		{
			path: '/demo5',
			name: 'demo5',
			// route level code-splitting
			component: () => import('../views/Demo5View.vue')
		},
		{
			path: '/demosvg',
			name: 'demosvg',
			// route level code-splitting
			component: () => import('../views/DemoSvgView.vue')
		},
		{
			path: '/demosize',
			name: 'demosize',
			// route level code-splitting
			component: () => import('../views/DemoSizeMode.vue')
		},
		{
			path: '/demo6',
			name: 'demo6',
			// route level code-splitting
			component: () => import('../views/DemoCompositionView.vue')
		}
	]
})

export default router