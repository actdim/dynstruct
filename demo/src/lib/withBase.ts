/**
 * Prefixes a root-relative path with the configured Astro `base`
 * (`/` locally, `/dynstruct/demo/` on GitHub Pages).
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
