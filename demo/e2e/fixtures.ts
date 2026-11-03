import { test as base, expect } from '@playwright/test';

export interface ConsoleWatcherFixture {
  errors: string[];
  warnings: string[];
  allowlist: (string | RegExp)[];
}

export const test = base.extend<{ consoleWatcher: ConsoleWatcherFixture }>({
  consoleWatcher: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const allowlist: (string | RegExp)[] = [];

      page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
          errors.push(text);
        } else if (type === 'warning') {
          warnings.push(text);
        }
      });

      page.on('pageerror', (err) => {
        errors.push(err.message);
      });

      const fixture: ConsoleWatcherFixture = {
        errors,
        warnings,
        allowlist,
      };

      await use(fixture);

      const isAllowed = (msg: string) =>
        allowlist.some((pattern) =>
          typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg)
        );

      const unexpectedErrors = errors.filter((err) => !isAllowed(err));
      const unexpectedWarnings = warnings.filter((warn) => !isAllowed(warn));

      expect(
        unexpectedErrors,
        `Unexpected browser console errors:\n${unexpectedErrors.join('\n')}`
      ).toEqual([]);

      expect(
        unexpectedWarnings,
        `Unexpected browser console warnings:\n${unexpectedWarnings.join('\n')}`
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
