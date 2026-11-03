import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// CI (GitHub Pages) sets DEMO_BASE=/dynstruct/demo/ and DEMO_SITE; local dev and builds stay at `/`.
const base = process.env.DEMO_BASE || '/';
const site = process.env.DEMO_SITE || undefined;

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'mobx',
        'mobx-react-lite',
        '@emotion/react',
        '@emotion/styled',
        '@mui/material',
      ],
    },
  },
});
