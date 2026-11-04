import { type DemoCatalogItem } from '../bus/portalMsgStruct';

export const SAMPLE_SSR_CATALOG: DemoCatalogItem[] = [
  {
    id: 'ssr-1',
    title: 'Astro Server-Side Rendering Engine',
    category: 'SSR',
    description: 'Generates static or dynamic server HTML with zero client JavaScript by default, enabling instant page loads and 100% crawler visibility.',
    rating: 5.0,
    badge: 'Core SSR',
  },
  {
    id: 'ssr-2',
    title: 'Dynstruct Component Model Hydration',
    category: 'Architecture',
    description: 'Mounts Dynstruct reactive contracts seamlessly over pre-rendered server DOM nodes without hydration mismatch warnings or DOM rebuilding.',
    rating: 4.9,
    badge: 'Hydration',
  },
  {
    id: 'ssr-3',
    title: 'Zero-FOUC Shell Separation',
    category: 'Performance',
    description: 'Separates document chrome (Tailwind CSS) from interactive widgets (Emotion / Material UI) to ensure zero layout shift during server render.',
    rating: 4.8,
    badge: 'Lighthouse 100',
  },
  {
    id: 'ssr-4',
    title: 'MsgMesh Client-Side Event Mesh',
    category: 'Networking',
    description: 'Bridges disparate Astro islands through typed pub/sub channels and RPC without requiring React Context providers at the root layout.',
    rating: 4.9,
    badge: 'Decoupling',
  },
  {
    id: 'ssr-5',
    title: 'Search Engine Optimization (SEO) Crawler Proof',
    category: 'SEO',
    description: 'Search bots inspect raw server markup and index 100% of the content without executing client JavaScript bundles.',
    rating: 5.0,
    badge: 'SEO Ready',
  },
  {
    id: 'ssr-6',
    title: 'Submodule Workspace Cohesion',
    category: 'Tooling',
    description: 'Monorepo pnpm workspaces maintain synchronized semver versions and autonomous git deployment lifecycles.',
    rating: 4.7,
    badge: 'Monorepo',
  },
];

export async function getSampleCatalog(): Promise<DemoCatalogItem[]> {
  // Simulate server-side async data retrieval (e.g. Database / CMS / S3)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...SAMPLE_SSR_CATALOG]);
    }, 10);
  });
}
