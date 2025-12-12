import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [
		svelte({
			hot: !process.env.VITEST
		})
	],
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['src/setupTests.ts']
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'$app/environment': path.resolve('./.svelte-kit/runtime/app/environment'),
			'$app/forms': path.resolve('./.svelte-kit/runtime/app/forms'),
			'$app/navigation': path.resolve('./.svelte-kit/runtime/app/navigation'),
			'$app/paths': path.resolve('./.svelte-kit/runtime/app/paths'),
			'$app/stores': path.resolve('./.svelte-kit/runtime/app/stores')
		},
		conditions: ['browser']
	}
});
