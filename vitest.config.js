import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			environment: 'jsdom',
			exclude: [...configDefaults.exclude, 'coverage', 'e2e/*'],
			root: fileURLToPath(new URL('./', import.meta.url)),
			coverage: {
				exclude: ["e2e/*", "src/app/*", "src/main.js", "src/components/index.js", "*.js"],
				provider: "v8",
				reporter: ['text', 'json', 'html'],
			}
		}
	})
)
