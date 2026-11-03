import { test, expect } from './fixtures';
import { waitForIslands } from './hydration';
import { SAMPLE_SSR_CATALOG } from '../src/data/sampleCatalog';

const ROUTES = ['/', '/showcase', '/cross-island', '/ssr-demo'] as const;

test.describe('Dynstruct Demo Smoke & Hydration Suite', () => {
  for (const route of ROUTES) {
    test(`route "${route}" hydrates cleanly with zero console errors and warnings`, async ({ page }) => {
      await page.goto(route);
      await waitForIslands(page);
    });
  }

  test('raw prerendered HTML contains no invalid DOM nesting inside ListItemText (REQ-1)', async ({ request }) => {
    for (const route of ROUTES) {
      const response = await request.get(route);
      expect(response.ok()).toBe(true);
      const html = await response.text();

      expect(html).not.toMatch(/<p[^>]*MuiListItemText[^>]*><div/i);
      expect(html).not.toMatch(/<span[^>]*MuiListItemText-primary[^>]*><div/i);
    }
  });

  test('/ssr-demo pre-renders all catalog titles and preserves state on sort/filter (REQ-7, REQ-8)', async ({
    request,
    page,
  }) => {
    // Check raw pre-rendered HTML contains every title before JS runs
    const response = await request.get('/ssr-demo');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    for (const item of SAMPLE_SSR_CATALOG) {
      expect(html).toContain(item.title);
    }

    // Hydrate in browser
    await page.goto('/ssr-demo');
    await waitForIslands(page);

    const searchInput = page.getByLabel('Client Search (Live Filtering After Hydration)');
    await searchInput.fill('Astro');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).innerText();
      expect(text.toLowerCase()).toContain('astro');
    }

    // Toggle sort: RATING -> TITLE
    const sortButton = page.getByRole('button', { name: /Sort by:/i });
    await expect(sortButton).toHaveText('Sort by: RATING');
    await sortButton.click();
    await expect(sortButton).toHaveText('Sort by: TITLE');

    // Filtered items should remain filtered after sort toggle
    const rowsAfterSort = page.locator('tbody tr');
    const countAfterSort = await rowsAfterSort.count();
    expect(countAfterSort).toBe(count);
    for (let i = 0; i < countAfterSort; i++) {
      const text = await rowsAfterSort.nth(i).innerText();
      expect(text.toLowerCase()).toContain('astro');
    }
  });

  test('/cross-island coordination and reset filter state (REQ-4)', async ({ page }) => {
    await page.goto('/cross-island');
    await waitForIslands(page);

    const searchInput = page.getByLabel('Search Titles or Descriptions');
    await searchInput.fill('ssr');

    // Filter Island dispatches to List Island
    await expect(page.getByText('Zero-FOUC Island SSR in Astro')).toBeVisible();
    await expect(page.getByText('ComponentStruct Type-Safe Contracts')).not.toBeVisible();
    await expect(page.getByText(/Received: [1-9]\d* event\(s\)/)).toBeVisible();

    // Reset filters
    await page.getByRole('button', { name: 'Reset Filters' }).click();

    // All items restored and min rating confirmed
    await expect(page.getByText('ComponentStruct Type-Safe Contracts')).toBeVisible();
    await expect(page.getByText('Zero-Boilerplate MobX Reactivity')).toBeVisible();
    await expect(page.getByText('Min Rating: 4.0')).toBeVisible();
  });

  test('playground overlays: driven by bus channels, no duplicate keys, fresh state on remount (REQ-2, REQ-3)', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForIslands(page);

    // Switch to Overlays scenario
    await page.getByRole('button', { name: 'Overlays & Toast Stack' }).click();

    // Rapid toast clicks
    const successBtn = page.getByRole('button', { name: 'Success Notice' });
    await successBtn.click();
    await successBtn.click();

    const alert = page.locator('.MuiSnackbar-root .MuiAlert-root');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(/Operation completed in 42ms/);

    // Switch scenario and back (unmount and remount DialogToastDemo)
    await page.getByRole('button', { name: 'Reactive Model & Actions' }).click();
    await page.getByRole('button', { name: 'Overlays & Toast Stack' }).click();

    // No stale toasts should be replayed or shown in the Snackbar
    await expect(page.locator('.MuiSnackbar-root .MuiAlert-root')).not.toBeVisible();

    // Toggle side drawer to open and inspect event stream via bus DRAWER.TOGGLE
    await page.getByRole('button', { name: 'Toggle Side Drawer' }).click();
    await expect(
      page.getByText('No events received yet. Click toast buttons to send notices.')
    ).toBeVisible();

    // Close drawer via Close Drawer button
    await page.getByRole('button', { name: 'Close Drawer' }).click();
    await expect(
      page.getByText('No events received yet. Click toast buttons to send notices.')
    ).not.toBeVisible();

    // Open Modal Dialog via DIALOG.OPEN bus channel
    await page.getByRole('button', { name: 'Open Modal Dialog' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('Dynstruct Contract Dialog')).toBeVisible();
    await expect(
      page.getByText('This modal dialog was dispatched via DIALOG.OPEN on @actdim/msgmesh bus.')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('playground async search: handles search query and RPC response via msgBroker (REQ-2)', async ({ page }) => {
    await page.goto('/');
    await waitForIslands(page);

    // Switch to Async scenario
    await page.getByRole('button', { name: 'Async RPC & Search Provider' }).click();

    const searchInput = page.getByLabel('Search Documentation & Topics');
    await searchInput.fill('ssr');

    await expect(page.getByText('Found: 1 item(s)')).toBeVisible();
    await expect(page.getByText('Zero-FOUC Island SSR in Astro')).toBeVisible();
  });

  test('playground contracts panel contains export type for all 5 scenarios (REQ-5)', async ({ page }) => {
    await page.goto('/');
    await waitForIslands(page);

    const scenarios = [
      { name: 'Complex Form & Validation', expectedContract: 'export type FormDemoStruct' },
      { name: 'Reactive Model & Actions', expectedContract: 'export type CounterStruct' },
      { name: 'Overlays & Toast Stack', expectedContract: 'export type DialogToastStruct' },
      { name: 'Reactivity Modes (deep / shallow / ref)', expectedContract: 'export type ReactivityStruct' },
      { name: 'Async RPC & Search Provider', expectedContract: 'export type AsyncSearchStruct' },
    ];

    for (const sc of scenarios) {
      await page.getByRole('button', { name: sc.name }).click();
      const codePre = page.locator('pre');
      await expect(codePre).toBeVisible();
      const codeText = await codePre.innerText();
      expect(codeText).toContain(sc.expectedContract);
    }
  });

  test('reactivity demo counts committed renders accurately without render-phase mutation (REQ-6)', async ({ page }) => {
    await page.goto('/');
    await waitForIslands(page);

    // Switch to Reactivity Modes scenario
    await page.getByRole('button', { name: 'Reactivity Modes (deep / shallow / ref)' }).click();

    const passesText = page.getByText(/View Render Passes: \d+/);
    await expect(passesText).toBeVisible();
    await expect(page.getByText('View Render Passes: 1')).toBeVisible();

    // Trigger deep mutation -> exactly +1 render pass
    await page.getByRole('button', { name: 'Mutate deepObject.nested.count++' }).click();
    await expect(page.getByText('View Render Passes: 2')).toBeVisible();

    // Trigger silent shallow item mutation -> 0 render passes
    await page.getByRole('button', { name: 'Mutate Item[0] In-Place (Silent)' }).click();
    await expect(page.getByText('View Render Passes: 2')).toBeVisible();
  });

  test('theme toggle switches html dark class and persists across navigation', async ({ page }) => {
    await page.goto('/');
    await waitForIslands(page);

    const html = page.locator('html');
    const initialIsDark = (await html.getAttribute('class'))?.includes('dark') ?? false;

    const toggleBtn = page.locator('#theme-toggle');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify class and data-theme toggled
    if (initialIsDark) {
      await expect(html).not.toHaveClass(/dark/);
      await expect(html).toHaveAttribute('data-theme', 'light');
    } else {
      await expect(html).toHaveClass(/dark/);
      await expect(html).toHaveAttribute('data-theme', 'dark');
    }

    // Navigate to /showcase and verify persisted theme is preserved immediately
    await page.goto('/showcase');
    await waitForIslands(page);
    if (initialIsDark) {
      await expect(html).not.toHaveClass(/dark/);
      await expect(html).toHaveAttribute('data-theme', 'light');
    } else {
      await expect(html).toHaveClass(/dark/);
      await expect(html).toHaveAttribute('data-theme', 'dark');
    }
  });

  test('showcase gallery features Dynstruct-MUI adapters across 4 categories with binding code', async ({ page }) => {
    await page.goto('/showcase');
    await waitForIslands(page);

    // Toggle binding pattern code viewer
    const viewCodeBtn = page.getByRole('button', { name: 'View Binding Pattern' });
    await expect(viewCodeBtn).toBeVisible();
    await viewCodeBtn.click();

    const codeBlock = page.locator('pre code');
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toContainText('ComponentStruct');
    await expect(codeBlock).toContainText('ComponentDef');

    // Switch between all 4 categories via Dynstruct-MUI tabs
    const categories = ['Form Controls & Inputs', 'Feedback & Indicators', 'Surfaces & Navigation', 'Actions & Buttons'];
    for (const cat of categories) {
      const tab = page.getByRole('tab', { name: cat });
      await expect(tab).toBeVisible();
      await tab.click();
    }
  });
});
