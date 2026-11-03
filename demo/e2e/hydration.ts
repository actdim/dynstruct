import { type Page } from '@playwright/test';

/**
 * Waits until all Astro islands on the page have completed client hydration.
 * Astro removes the 'ssr' attribute from <astro-island> once hydrated.
 */
export async function waitForIslands(page: Page, timeout = 15000): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll('astro-island[ssr]').length === 0,
    undefined,
    { timeout }
  );
}
