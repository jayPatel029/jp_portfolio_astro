// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://my-portfolio-ec4b7.web.app',
  vite: {
    plugins: [tailwindcss()],
  },
});
