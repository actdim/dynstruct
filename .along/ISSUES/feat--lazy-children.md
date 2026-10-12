---
protocol: along
protocol_version: "4.4.10"
slug: lazy-children
type: feat
status: open
priority: medium
created: 2026-10-12
updated: 2026-10-12
agent: claude-code
parent: task--leftovers-after-params-semantics
tags: [componentModel, react, performance]
blocked_by: []
related: [debt--generic-struct-component-props]
---

# Lazy children: create a child from a lazily imported hook-constructor (code splitting)

## Problem

A child in `def.children` is created by calling its hook-constructor synchronously while the parent is created
(`reader: useEpubReader({...})`, or a factory child `(p) => useEpubReader({...})` per React `key`). The
hook-constructor module must therefore be imported statically, which defeats code splitting.

Consumer case (mempart webapp): `MediaViewerStub` / `LibraryView` load heavy viewers with `React.lazy`
(`PdfReader` - pdf.js, `VideoPlayer` - Media Chrome, `ImageViewer`, `TextEditor` - CodeMirror) and render their
`toReact` exports as JSX tags inside a dynstruct `view`, against the "children, not inline JSX" rule (justified
`eslint-disable mempart/no-jsx-dynstruct-component`). Per-file recreation alone is already covered by factory
children with a React `key`; the missing piece is lazy loading.

## Directions to evaluate

- a lazy factory child: `children: { reader: lazyChild(() => import('./PdfReader').then((m) => m.usePdfReader), (use, p) => use({ file: bind(() => p.file) })) }`,
  rendered as `<c.children.Reader key=... file=... />` inside `React.Suspense` (or with a built-in fallback);
- how the struct types the child (same `ComponentStruct` as an eager child; `c.children.reader` instance access only
  after load);
- hooks-order safety: the child's hook-constructor runs in its own component render after the module resolves (not
  in the parent's render), so the parent's hook order does not depend on the load;
- error routing (load failure -> `onCatch` / error boundary, retry like the webapp `lazyWithRetry`), `regType`
  derivation by the Vite plugin for lazily imported hook-constructors, DEV checks.

## Acceptance Criteria
- [ ] API for a lazy (factory) child with Suspense / fallback and load-error handling
- [ ] Types: struct of a lazy child equals the eager one; `<c.children.X />` props typed
- [ ] Tests: load, fallback, per-key recreation, load failure routed to `onCatch`
- [ ] Docs: AGENTS.md (Composition rules), `topic--04-react-integration`
- [ ] webapp follow-up: MediaViewerStub / LibraryView viewers moved to lazy children, eslint-disable removed
- [ ] Automated tests passing
