import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Fuerza modo runes en el proyecto (no en librerías). Removible en Svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Adapter de Cloudflare Workers: sirve SSR + rutas de API en el edge.
			adapter: adapter()
		})
	],
	test: {
		// Tests unitarios del motor de puntos (función pura).
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
