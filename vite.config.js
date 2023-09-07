import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import * as packageJson from './package.json'

const packageName = "pdf-component-vue"

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
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
	publicDir: command === "serve" ? "public" : false,
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	}
})
)
