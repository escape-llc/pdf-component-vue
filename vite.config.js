import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import * as packageJson from './package.json'

const packageName = packageJson.name

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		lib: {
			entry: resolve('src', 'components/index.js'),
			name: packageName,
			formats: ['es', 'umd'],
			fileName: (format) => `${packageName}.${format}.js`,
		},
		rollupOptions: {
			external: [...Object.keys(packageJson.peerDependencies)],
			output: {
				globals: { vue: "vue" }
			}
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
