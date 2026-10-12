---
protocol: along
protocol_version: "4.4.10"
slug: generic-struct-component-props
type: debt
status: open
priority: low
created: 2026-10-12
updated: 2026-10-12
agent: claude-code
parent: task--leftovers-after-params-semantics
tags: [types, componentModel]
blocked_by: []
related: [debt--dynstruct-review-followups]
---

# ComponentProps typing for generic component structs (ComponentProp values without casts)

## Problem

In a hook-constructor whose struct depends on a generic type parameter, a `ComponentProp` value in `def.props`
does not typecheck. Example: `@actdim/dynstruct-mui` `useAutocomplete = <T>(...)` with
`AutocompleteStruct<T>` (`value: T | null`, `options: T[]`):

```ts
slotProps: prop({ reactive: 'ref' }),                                   // TS2322 on def.props
slotProps: prop<MuiTextFieldProps['slotProps']>({ reactive: 'ref' }),   // TS2322
get slotProps() { return prop<MuiTextFieldProps['slotProps']>({ reactive: 'ref' }); }, // TS2322
```

`ComponentProps<P>` (`src/componentModel/contracts.ts`) is
`{ [K in keyof P]: P[K] | ComponentProp<P[K]> } & { [K in KeyPath<P, boolean>]?: ... }`. While `P` depends on an
unresolved `T`, TypeScript defers the mapped type (the `KeyPath` part in particular) and cannot relate a
`ComponentProp<X>` value to it. Non-generic wrappers are fine. The only workaround is a cast
(`prop(...) as unknown as MuiTextFieldProps['slotProps']`, kept in dynstruct-mui `Autocomplete.tsx`, see
dynstruct-mui `debt--autocomplete-slotprops-cast`).

## Directions to evaluate

- a `ComponentProps` form that stays assignable with generic structs (e.g. avoid the `KeyPath` intersection for
  top-level keys, or split top-level and nested annotations);
- a typed helper / `prop` overload that yields a value assignable to `P[K]` (e.g. `refProp<T>(): T` branded at
  runtime as a `ComponentProp`);
- check the impact on inference and errors for all existing (non-generic) structs and on `KeyPath` nested
  annotations (`'user.tags': prop(...)`).

## Acceptance Criteria
- [ ] A generic hook-constructor can declare `prop({ reactive: 'ref' })` (or the new helper) without a cast
- [ ] dynstruct-mui `Autocomplete.tsx` cast removed
- [ ] Typing tests for generic and non-generic structs; existing `tsc -b` clean in dynstruct, dynstruct-mui, webapp
- [ ] Automated tests passing
