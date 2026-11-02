import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js']
  },
  resolve: {
    conditions: ['browser'],
    // Mirror SvelteKit's $lib alias so components can be tested directly
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) }
  }
});
