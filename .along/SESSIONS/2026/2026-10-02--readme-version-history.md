---
protocol: along
protocol_version: "4.4.1"
date: 2026-10-02
slug: readme-version-history
agent: claude-code
branch: main
commit: 368c305
summary: README changelog for 0.9.0 - 1.8.0 (46 versions) from git history and diffs, __pycache__ ignored, Along lifecycle scripts tracked
milestone: v2.0.0-along-transition
issues_advanced: []
issues_completed: [docs--readme-version-history]
decisions: []
risks_logged: []
spikes_conducted: []
---

# Session: Readme version history

## Summary
README changelog for 0.9.0 - 1.8.0 (46 versions) from git history and diffs, __pycache__ ignored, Along lifecycle scripts tracked

## Work Completed
- `README.md`: new `## Changelog` section before `## License` - 46 versions (0.9.0 - 1.8.0) in 43 headings, newest first, dated. Built from `package.json` version per commit; vague commits checked against their diffs and exported symbols. Breaking renames marked (e.g. `getFC` -> `toReact`, `ApiError` -> `HttpClientError`, `ClientBase` -> `HttpClient`, events moved to `params.$events`).
- `CHANGELOG.md`: 1.8.0 `### Fixed` gains the `npm test` both-suites fix (`368c305`); "Earlier versions" points to the README section.
- `.gitignore`: `__pycache__/`, `*.pyc`; Along lifecycle hooks `.along/scripts/build.py`, `test.py` tracked.
- Pushed the 4 pending commits from 2026-10-01 (CHANGELOG, gate manifest, dashboard export ignores, `npm test` runs both suites).
- npm has up to 1.7.2; 1.8.0 is documented ahead of publishing.

## Code Review & Blast Radius
- Docs and ignore rules only in this session; no source changes. Tests not rerun.
- `.along/scripts/*.py` compile (`python -m py_compile`).
- Typography: added lines are ASCII only.
