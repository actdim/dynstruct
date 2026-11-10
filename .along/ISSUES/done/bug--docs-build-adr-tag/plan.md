# Plan: fix docs build on raw tags in published ADRs

Issue: `bug--docs-build-adr-tag`
Execution Mode: Direct

## Cause

`docs/decisions/*.md` are copies of `.along/DECISIONS/*.md` published by the KB sync. The ADR
`no-agent-vendor-dev-tooling` contains `pnpm --dir <pkg> run <script>` as plain text. VitePress
passes Markdown through the Vue template compiler, which reads `<pkg>` / `<script>` as elements and
fails with "Element is missing end tag".

ADRs are immutable (superseded, never edited), and the copy in `docs/decisions/` is regenerated on
every sync, so neither file is the place for the fix.

## Fix

In `docs/.vitepress/config.ts` (`markdown.config`), for pages under `decisions/` render
`html_inline` and `html_block` tokens as escaped text (`md.utils.escapeHtml`). ADR copies are
generated plain text; raw HTML is never intended there. Other pages are untouched (their HTML-like
snippets are inside code fences).

## Verification

- `pnpm run docs:build` succeeds without excluding anything.
- The built ADR page shows `<pkg>` and `<script>` as text.
- `along kb-sync` then a second build: still green (fix survives regeneration).
- `along lint --worktree`, `along test`.

## Revision 2 (2026-11-10T21:22:18Z, ExitPlanMode)

# Plan: fix docs build on raw tags in published ADRs

Issue: `bug--docs-build-adr-tag` (dynstruct `.along/`, in-progress)
Execution Mode: Direct

## Context

`pnpm run docs:build` fails at HEAD:
`docs/decisions/ADR-2026-11-08--no-agent-vendor-dev-tooling.md (9:166): Element is missing end tag`.

The ADR's Decision line contains `pnpm --dir <pkg> run <script>` as plain text. VitePress passes
Markdown through the Vue template compiler, which reads `<pkg>` / `<script>` as HTML elements.

`docs/decisions/*.md` are copies of `.along/DECISIONS/*.md` that `along kb-sync` regenerates on every
sync, and ADRs are immutable by protocol (superseded, never edited). So neither file is the right
place for the fix: an edit to the copy is lost on the next sync, an edit to the ADR breaks the
protocol.

## Fix (one file)

`docs/.vitepress/config.ts`, inside the existing `markdown.config: (md) => { ... }`:

- For pages whose `env.relativePath` starts with `decisions/`, render `html_inline` and
  `html_block` tokens as escaped text (`md.utils.escapeHtml(token.content)`); keep the default
  renderers for every other page.
- Why scoped: ADR copies are generated plain text with no intended HTML. Other docs pages are left
  as they are (their HTML-like snippets are inside code fences anyway).

## Issue file

Adjust `REQ-2` of `bug--docs-build-adr-tag` to match the immutability rule: placeholders in published
ADRs render as text through the docs renderer, so the ADR source and its generated copy stay
unchanged. Plan saved as `.along/ISSUES/bug--docs-build-adr-tag/plan.md` (already written).

## Verification

- `pnpm run docs:build` succeeds with nothing excluded.
- Built page `.dist-docs/decisions/ADR-2026-11-08--no-agent-vendor-dev-tooling.html` shows
  `&lt;pkg&gt;` / `&lt;script&gt;` as text.
- `along kb-sync`, then build again: still green (the fix survives regeneration).
- `along lint --worktree`, `along test`.
- Commit via `along commit ... -i docs-build-adr-tag`, then `along wrap docs-build-adr-tag`.
