// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jaypatel-dev-f91cb.web.app',
  integrations: [preact(), sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
  vite: {
    plugins: [tailwindcss()],
    ssr: { external: ['@resvg/resvg-js'] },
    optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  },
});
