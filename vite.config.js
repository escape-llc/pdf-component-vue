import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import * as packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		lib: {
			entry: resolve('src', 'components/index.js'),
			name: 'pdf-component-vue',
			formats: ['es', 'umd'],
			fileName: (format) => `pdf-component-vue.${format}.js`,
		},
		rollupOptions: {
			external: [...Object.keys(packageJson.peerDependencies)],
		},
	},
	plugins: [
		vue(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	}
})
