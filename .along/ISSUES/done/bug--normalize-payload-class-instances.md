---
protocol: along
protocol_version: "4.4.10"
slug: normalize-payload-class-instances
type: bug
status: done
completed: 2026-10-12
priority: high
created: 2026-10-12
updated: 2026-10-12
agent: claude-code
parent: task--leftovers-after-params-semantics
tags: [msgbus, componentModel]
blocked_by: []
related: []
---

# c.msgBus payload normalization turns class instances (File, Blob, Date, Map) into empty objects

`normalizePayload` (`src/componentModel/core.tsx`), applied to every payload sent / requested through the
component proxy `c.msgBus`, rebuilt any non-array object from its own enumerable keys. Class instances have none
(or not the relevant ones), so `File`, `Blob`, `Date`, `Map`, `AbortSignal` arrived as `{}`. Found while moving the
webapp `UploadFab` to MsgMesh (`APP.VFS.UPLOAD_FILES` carries `File[]`).

Fix: a non-plain object (not an array, not observable) is returned as is; observables are still converted with
`toPlain`, plain objects copied.

## Acceptance Criteria
- [x] `tests/react/normalize-payload.test.tsx`: File / Date / Map nested and a top-level Blob kept by reference;
      observables and plain objects handled as before (red before the fix)
- [x] Automated tests passing
