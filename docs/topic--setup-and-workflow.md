---
protocol: along
protocol_version: "2.2.8"
slug: setup-and-workflow
title: Setup & Workflow
type: topic
created: 2026-08-27
updated: 2026-09-02
tags: [setup-and-workflow]
---

# @actdim/dynstruct Setup, Build & Storybook Workflow

## 1. Prerequisites & Installation

- **Node.js**: >= 20.0.0
- **Package Manager**: `pnpm` (version ~10.21.0)
- **TypeScript**: >= 5.9.3

Install dependencies:
```bash
pnpm install
```

### Peer Dependencies
```bash
pnpm add @actdim/msgmesh @actdim/utico react react-dom mobx mobx-react-lite mobx-utils react-router react-router-dom rxjs uuid path-to-regexp jwt-decode
```

## 2. Scripts & Workflows

| Command | Action | Description |
|---|---|---|
| `pnpm run build` | `tsc -b tsconfig.json && vite build` | Typechecks and compiles ESM packages with `.d.ts` declaration maps |
| `pnpm run test` | `npx vitest --config=vitest.node.config.ts --no-cache` | Runs unit test suite under Node.js |
| `pnpm run test:w` | `npx vitest --config=vitest.node.config.ts --watch` | Runs test watcher in interactive mode |
| `pnpm run storybook` | `storybook dev -p 6006` | Launches interactive Storybook environment at `http://localhost:6006` |
| `pnpm run build-storybook` | `storybook build` | Builds static Storybook documentation bundle |
| `pnpm run typecheck` | `tsc -b tsconfig.json` | Validates TypeScript compiler checks across all source files and stories |
| `pnpm run lint` | `eslint "./**/*.{ts,tsx}"` | Runs ESLint |
| `pnpm run format` | `prettier --write .` | Formats all files with Prettier |

## 3. Storybook Story Catalog (`src/_stories/componentModel/`)

The Storybook suite provides live interactive demonstrations of all architectural capabilities:
- **`BasicCommunicationExample`**: Decoupled message bus communication between Producer and Consumer components.
- **`StateExample`**: Reactive model state, nested object tracking, and avatar view synchronization.
- **`CustomMsgStructExample`**: Complex multi-component message bus with `TodoList` and `TodoEdit`.
- **`ParentChildConnectionExample`**: Hierarchical component tree, two-way bindings, and directional message filtering (`FromAncestors`).
- **`EffectDemo`**: Reactive autorun effect handlers and automatic property re-computation.
- **`ErrorBoundaryDemo`**: Dynamic error isolation and fallback overlays.
- **`ServiceCallExample` & `SecurityServiceExample`**: Backend API invocation, authentication tokens, and login dialog flows.

## 4. Cross-Links
- [Knowledge Base Root](./INDEX.md)
- [Architecture](./topic--architecture.md)
- [Domain Model](./topic--domain-model.md)
- [API Reference](./topic--05-api-reference.md)
