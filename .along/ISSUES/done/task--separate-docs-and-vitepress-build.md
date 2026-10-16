---
protocol: along
protocol_version: "4.4.15"
slug: separate-docs-and-vitepress-build
type: task
status: done
completed: 2026-10-16
priority: medium
created: 2026-10-16
updated: 2026-10-16
agent: antigravity
tags: []
milestone: v2.0.0
parent: task--separate-docs-and-vitepress-build
blocked_by: []
related: []
---

# Separate docs sources and VitePress build artifacts

## Background Context
In `@actdim/dynstruct`, the `docs/` folder contains Markdown documentation, architectural decisions (`docs/decisions/`), and progressive disclosure manifests.
Previously, VitePress built into `docs/.vitepress/dist` and cached in `docs/.vitepress/cache`. When published to npm with `files: ["docs", ...]`, the entire compiled website (including client/server bundles and fonts) was packaged into the tarball.

## Implementation Details
1. Configured `docs/.vitepress/config.ts`:
   - `outDir: '../.dist-docs'`
   - `cacheDir: '../node_modules/.cache/vitepress'`
2. Added `!docs/.vitepress` to `package.json` `files` array so `.vitepress` is excluded from npm releases while preserving `docs/*.md` and `docs/decisions/*.md`.
3. Updated `.github/workflows/pages.yml` to upload Pages artifact from `.dist-docs`.
4. Added `.dist-docs/` to `.gitignore`.
5. Verified `pnpm run docs:build` generates `.dist-docs/` cleanly in 6.43s.
6. Verified `npm pack --dry-run` yields 264 kB tarball with 0 VitePress artifacts.

## Acceptance Criteria
- [x] Set `outDir: '../.dist-docs'` and `cacheDir: '../node_modules/.cache/vitepress'` in `docs/.vitepress/config.ts`
- [x] Add `!docs/.vitepress` to `package.json` `files`
- [x] Update `.github/workflows/pages.yml` artifact path to `.dist-docs`
- [x] Add `.dist-docs/` to `.gitignore`
- [x] Verify `docs:build` compiles outside `docs/`
- [x] Verify `npm pack --dry-run` excludes all `.vitepress` build artifacts and configs
- [x] All 86 tests pass cleanly (`pnpm test`)
