# Plan: auth ensure on the sign-in page must not drop its query

Issue: `bug--signin-ensure-drops-query` (dynstruct). Written 2026-11-20 against dynstruct HEAD `5cee517`
(Mempart root records the same gitlink).
Execution Mode: Direct (2 source files, 1 test file, 1 doc; one package).

Paths: `D` = `D:\Src\my\actdim\mempart\src\packages\dynstruct`, `S` = `D:\Src\my\actdim\mempart\src`,
`M` = `D:\Src\my\actdim\mempart`. Run dynstruct commands from `D`. Never `cd` into `S\app-core`.

## Decision

Fix chosen: when `APP.SECURITY.AUTH.ENSURE` runs while the browser already is on the sign-in page,
`ensureAuth` does NOT send `APP.NAV.GOTO` at all (REQ-1, first option). It still waits for
`APP.SECURITY.AUTH.SIGNIN` / `SIGNOUT` (`group: 'out'`) as today, so the pending ensure resolves when the
sign-in page signs in. The page keeps its whole URL, `devLogin=1` included (REQ-2).

Why not "preserve the query": the callback URL would have to merge two queries (the page's own and the
unwrapped `callbackUrl`), and a re-navigation to the same page brings nothing. Skipping is one `if` and
leaves `resolveSignInCallbackUrl` and its 6 tests unchanged.

The check is a new pure helper `isSignInLocation` in `src/appDomain/navigation.ts`, using the same
slash normalization (`trimSlashes`) as `resolveSignInCallbackUrl`, so it is unit-testable (REQ-3).

## Rules for the executor

- Every edit is an exact replacement: find BEFORE, replace with AFTER. Before each edit run the
  `grep -c` given with it; it must print `1`. If not, or BEFORE is not found exactly, STOP and report
  the file and step; the plan is fixed with `along plan revise` after the user agrees. Do not improvise.
- Touch only the files named here. Anything else you notice goes to the issue under `## Notes`.
- Do not bump any version (`package.json` stays `1.14.1`); versions move only monorepo-wide.
- No heredocs or `python -c` for file content; use the editor tools.
- Never `cd` into `S\app-core`; use `git -C`.

## Step 0. Start and baselines

0.1 `git -C D:/Src/my/actdim/mempart/src/packages/dynstruct status --short`: no modified tracked
    files under `src/` or `tests/`. Otherwise STOP. `git -C D:/Src/my/actdim/mempart/src/packages/dynstruct log -1 --format=%h`
    prints `5cee517`; if not, re-check every BEFORE below with its `grep -c` before editing.

0.2 From `D`: `along start signin-ensure-drops-query`.

0.3 Baselines from `D` (write the pass counts and the lint result into the issue `## Notes`):

```powershell
python .along/scripts/test.py
pnpm exec eslint src/appDomain/navigation.ts src/services/react/SecurityService.tsx tests/signInCallbackUrl.test.ts -f unix
```

## Step 1. Helper `isSignInLocation` (REQ-1)

File `D\src\appDomain\navigation.ts`. Check: `grep -c "function trimSlashes(path: string) {" src/appDomain/navigation.ts` prints `1`.

BEFORE:

```ts
function trimSlashes(path: string) {
    return path.replace(/^\/+|\/+$/g, '');
}
```

AFTER:

```ts
function trimSlashes(path: string) {
    return path.replace(/^\/+|\/+$/g, '');
}

/**
 * True when the location already is the sign-in page (leading and trailing slashes ignored). Used by
 * `SecurityService` to skip a second redirect, which would replace the page's query (for example
 * `devLogin=1`) with a bare `callbackUrl`.
 */
export function isSignInLocation(signInPath: string, location: { pathname: string }): boolean {
    return trimSlashes(location.pathname) === trimSlashes(signInPath);
}
```

## Step 2. `ensureAuth` skips the redirect on the sign-in page (REQ-1, REQ-2)

File `D\src\services\react\SecurityService.tsx`.

2.1 Import. Check: `grep -c "import { resolveSignInCallbackUrl } from '@/appDomain/navigation';" src/services/react/SecurityService.tsx` prints `1`.

BEFORE:

```tsx
import { resolveSignInCallbackUrl } from '@/appDomain/navigation';
```

AFTER:

```tsx
import { isSignInLocation, resolveSignInCallbackUrl } from '@/appDomain/navigation';
```

2.2 The redirect in `ensureAuth` (lines about 232-241). Check:
`grep -c "callbackUrl: resolveSignInCallbackUrl(m.domainConfig.routes.authSignInPage" src/services/react/SecurityService.tsx` prints `1`.

BEFORE:

```tsx
        c.msgBus.send({
            channel: $NAV_GOTO,
            payload: {
                path: m.domainConfig.routes.authSignInPage,
                params: {
                    callbackUrl: resolveSignInCallbackUrl(m.domainConfig.routes.authSignInPage, typeof window !== 'undefined' ? window.location : { pathname: '/', search: '', hash: '' }),
                },
            },
        });

        await Promise.race([signIn(), signOut()]);
```

AFTER:

```tsx
        const location = typeof window !== 'undefined' ? window.location : { pathname: '/', search: '', hash: '' };
        // Already on the sign-in page (a request on it got a 401): navigating again would replace the
        // page's query (for example devLogin=1) with a bare callbackUrl. Stay and wait for its sign-in.
        if (!isSignInLocation(m.domainConfig.routes.authSignInPage, location)) {
            c.msgBus.send({
                channel: $NAV_GOTO,
                payload: {
                    path: m.domainConfig.routes.authSignInPage,
                    params: {
                        callbackUrl: resolveSignInCallbackUrl(m.domainConfig.routes.authSignInPage, location),
                    },
                },
            });
        }

        await Promise.race([signIn(), signOut()]);
```

`$NAV_GOTO` is already imported in this file (it is used by the BEFORE block). If typecheck rejects
`location` (for example a name clash with a variable in the enclosing scope), rename it to
`currentLocation` in all three places of this block only, and note it in the issue.

## Step 3. Tests (REQ-3)

File `D\tests\signInCallbackUrl.test.ts` (node project, `vitest.node.config.ts`; it imports through
the `@/` alias).

3.1 Check: `grep -c 'import { resolveSignInCallbackUrl } from "@/appDomain/navigation";' tests/signInCallbackUrl.test.ts` prints `1`.

BEFORE:

```ts
import { describe, it, expect } from "vitest";
import { resolveSignInCallbackUrl } from "@/appDomain/navigation";
```

AFTER:

```ts
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { isSignInLocation, resolveSignInCallbackUrl } from "@/appDomain/navigation";
```

3.2 Append at the END of the file (after the last `});` of `describe("resolveSignInCallbackUrl", ...)`):

```ts

describe("isSignInLocation", () => {
    it("is true on the sign-in page with any query (devLogin=1 kept by skipping the redirect)", () => {
        expect(isSignInLocation("auth/sign-in", loc("/auth/sign-in?devLogin=1"))).toBe(true);
        expect(isSignInLocation("/auth/sign-in", loc("/auth/sign-in/?devLogin=1&callbackUrl=%2Fexplorer"))).toBe(true);
    });

    it("is false on other pages, including ones that only start with the sign-in path", () => {
        expect(isSignInLocation("auth/sign-in", loc("/explorer?devLogin=1"))).toBe(false);
        expect(isSignInLocation("auth/sign-in", loc("/auth/sign-in-help"))).toBe(false);
    });
});

describe("SecurityService ensureAuth on the sign-in page", () => {
    it("does not navigate again when already on the sign-in page", () => {
        const source = fs.readFileSync(path.resolve(process.cwd(), "src/services/react/SecurityService.tsx"), "utf-8");
        expect(source).toMatch(/if \(!isSignInLocation\(m\.domainConfig\.routes\.authSignInPage, location\)\) \{\s*c\.msgBus\.send\(\{\s*channel: \$NAV_GOTO,/);
    });
});
```

The source check guards the wiring; a full render test would need a stubbed router and a
never-resolving ensure promise, which the existing `tests/react` tests do not have. The path is
resolved from `process.cwd()`: run vitest only from `D` (`python .along/scripts/test.py` also runs
there). No other test in `tests/` reads files yet; if `fs` / `path` imports fail typecheck under
`tsconfig.dev.json`, STOP and report the error.

## Step 4. Docs

File `D\docs\topic--cookbook-auth-navigation.md`. Check:
``grep -c 'with a `callbackUrl` of the current location.' docs/topic--cookbook-auth-navigation.md`` prints `1`.

BEFORE:

```md
**How it works.** `ENSURE` returns `AuthInfo` when authenticated; otherwise it sends
`APP.NAV.GOTO` to `routes.authSignInPage` with a `callbackUrl` of the current location.
```

AFTER:

```md
**How it works.** `ENSURE` returns `AuthInfo` when authenticated; otherwise it sends
`APP.NAV.GOTO` to `routes.authSignInPage` with a `callbackUrl` of the current location. When the
current location already is the sign-in page, it sends no `APP.NAV.GOTO` (the page keeps its query,
for example `devLogin=1`) and only waits for the sign-in or sign-out.
```

Then from `D`: `/along-kb-sync` (rebuilds `llms-full.txt` / `docs/INDEX.md`; never hand-edit them).

## Step 5. Checks (from `D`)

```powershell
pnpm exec vitest --config=vitest.node.config.ts --no-cache tests/signInCallbackUrl.test.ts
pnpm run typecheck
python .along/scripts/test.py
pnpm exec eslint src/appDomain/navigation.ts src/services/react/SecurityService.tsx tests/signInCallbackUrl.test.ts -f unix
pnpm run build
```

Expected: the focused run shows the 6 old and 3 new tests passing; `test.py` (node + react projects)
passes with 3 more tests than the Step 0.3 baseline; lint problems not higher than the baseline;
`build` (`tsc -b tsconfig.json && vite build`) writes `dist/` without errors. `dist/` is what Mempart
loads (`@actdim/dynstruct` resolves to `D` through `workspace:*` and its `exports` point at
`dist/*.es.js`; the webapp has no source alias for dynstruct).

## Step 6. Mempart browser check (required; record results in the issue under `## Verification`)

Uses the Step 5 build. Servers through package scripts from `S` (no `.claude/launch.json`):
`pnpm dev:backend`, then `pnpm dev:webapp:force` (`vite --force` re-optimizes the dependency cache so
the new `dist/` is used). Requires `NODE_ENV=development`, `AUTH_DEV_SEED_USER=true` and
`AUTH_DEV_AUTOLOGIN_USER` in `S\apps\server\.env.local`; never print their values. If they are not
set, STOP this step and tell the user.

1. Signed out (clear site data or use a fresh browser profile), open
   `http://localhost:5173/auth/sign-in?devLogin=1`. Do not click anything.
2. After 5 seconds run a page script returning
   `{ href: location.href }` and check that the URL is no longer the sign-in page (you landed on the
   app, signed in as the seeded dev user) and was never rewritten to `/auth/sign-in?callbackUrl=%2F`
   while still signed out. Record the JSON.
3. Regression: signed out, open `http://localhost:5173/explorer`: the app goes to
   `/auth/sign-in?callbackUrl=%2Fexplorer` (ensure still redirects from other pages). Record the URL.

## Step 7. Finish

7.1 `git -C D:/Src/my/actdim/mempart/src/packages/dynstruct diff --stat`: only
`src/appDomain/navigation.ts`, `src/services/react/SecurityService.tsx`,
`tests/signInCallbackUrl.test.ts`, `docs/topic--cookbook-auth-navigation.md`, the kb-sync outputs
(`llms-full.txt`, `docs/public/llms-full.txt`, `docs/INDEX.md` if changed) and this issue. `dist/` is
not tracked; if it shows up, STOP and report.

7.2 From `D`: `/along-commit -i signin-ensure-drops-query`, then
`along wrap signin-ensure-drops-query --summary "..." --no-decisions`. Do not wrap with Step 6 NOT
RUN: leave the issue `in-progress` and tell the user. Do not push unless the user asks.

7.3 Gitlink in the Mempart root (after 7.2, from `M`; the root repo records the submodule commit):
- `git -C D:/Src/my/actdim/mempart status --short src/packages/dynstruct` shows ` M src/packages/dynstruct`
  (new commits). Nothing else of the root is staged by this step.
- Commit only that path with the root's own issue binding: the root commit needs an active root issue
  (gate `commit-issue-binding`). Ask the user which root issue to bind (for example the umbrella that
  tracks submodule updates) or whether to leave the gitlink for the next root commit. Never stage the
  root's other modified files (`.along/ISSUES/task--app-core-extraction.md`,
  `src/scripts/run-starter-integration.ts` were modified before this plan).
- No version bump, no tag: versions and tags move only monorepo-wide (`pnpm run version:sync`,
  `M\docs\topic--setup-and-workflow.md`, section 4).
