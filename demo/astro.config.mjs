import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const demoDir = path.dirname(fileURLToPath(import.meta.url));

// Resolve all workspace and repository root directories upwards so that Vite can serve
// hoisted/symlinked monorepo node_modules (@astrojs/react client runtime, etc.) when running
// inside a parent monorepo like mempart, as well as in standalone dynstruct development.
function findAllowedRoots(startDir) {
  const roots = new Set([startDir]);
  let current = startDir;
  while (true) {
    const parent = path.dirname(current);
    if (!parent || parent === current) {
      break;
    }
    if (
      fs.existsSync(path.join(parent, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(parent, '.git')) ||
      fs.existsSync(path.join(parent, 'node_modules'))
    ) {
      roots.add(parent);
    }
    current = parent;
  }
  return Array.from(roots);
}

// CI (GitHub Pages) sets DEMO_BASE=/dynstruct/demo/ and DEMO_SITE; local dev and builds stay at `/`.
const base = process.env.DEMO_BASE || '/';
const site = process.env.DEMO_SITE || undefined;

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [react()],
  vite: {
    server: {
      fs: {
        allow: findAllowedRoots(demoDir),
      },
    },
    plugins: [tailwindcss()],
    resolve: {
      dedupe: [
        '@actdim/dynstruct',
        '@actdim/msgmesh',
        '@actdim/utico',
        'react',
        'react-dom',
        '@emotion/react',
        '@emotion/styled',
        '@mui/material',
      ],
    },
    ssr: {
      noExternal: [
        /@actdim\/.*/,
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
      ],
    },
  },
});
