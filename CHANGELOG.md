# Changelog

All notable changes to `@actdim/dynstruct` are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.8.0] - 2026-10-01

Commit `2979886`.

### Fixed
- Components no longer break under the React StrictMode effect re-mount (`bug--strictmode-lifecycle`).
- `params.$events` callbacks are no longer frozen at the first render: lifecycle hooks, `onCatch` and model event handlers call the latest ones (`bug--stale-params-events`).
- Syncing incoming `params` into the model no longer mutates MobX observables during render (`bug--render-phase-props-sync`).

### Added
- `net`: `HttpClientError` / `HttpNetworkError` classification and `isNetworkFailure` (browser and node network errors).

### Changed
- Docs: child composition (`def.children`) and `bindProp` priority (`docs--child-composition-and-bindprop-priority`).
- Along protocol 4.4.1; AI commit attribution disabled.

## [1.7.2] - 2026-09-27

Commits `3c37508`, `14857fe`.

### Changed
- Docs: `ComponentStructExt`, `ComponentProp<T>` reactivity modes and other implemented features documented (`docs--missing-architectural-features`).

### Fixed
- Documentation CI workflow and lockfile synchronization.

## Earlier versions

See the git history (`git log --oneline`).
