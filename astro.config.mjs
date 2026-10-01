// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jaypatel-dev-f91cb.web.app',
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
  vite: {
    plugins: [tailwindcss()],
    ssr: { external: ['@resvg/resvg-js'] },
    optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  },
});
