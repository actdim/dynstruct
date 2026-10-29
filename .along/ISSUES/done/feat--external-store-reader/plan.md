# Living Plan: external-store-reader

## Revision 1 (2026-10-29T11:05:03Z, plan approve --plan-file)

# Plan: fromExternalStore (dynstruct feat--external-store-reader)

Execution Mode: Direct (phase 1 of umbrella `bug--locale-switch-no-rerender`; 1 source file, 1 test file, docs).

## Steps

1. `src/componentModel/core.tsx`:
   - import `createAtom` from `mobx` (MobX stays inside dynstruct).
   - add, next to `bind` / `bindProp`:

     ```ts
     /**
      * Makes external (non-model) state trackable: calling the returned reader inside a view, binding getter,
      * computed prop or effect re-runs it when the store calls onChange. Same contract as useSyncExternalStore.
      * Subscribes only while observed.
      */
     export function fromExternalStore<T>(
         subscribe: (onChange: () => void) => () => void,
         getSnapshot: () => T,
         name = 'externalStore',
     ): () => T {
         let unsubscribe: (() => void) | null = null;
         const atom = createAtom(
             name,
             () => {
                 unsubscribe = subscribe(() => atom.reportChanged());
             },
             () => {
                 unsubscribe?.();
                 unsubscribe = null;
             },
         );
         return () => {
             atom.reportObserved();
             return getSnapshot();
         };
     }
     ```
   - Check `reportChanged` from a store callback does not trip `enforceActions` warnings in DEV; if it does, wrap it
     in `runInAction`.
2. `tests/react/external-store.test.tsx` (Vitest + Testing Library, pattern of `reactivity-and-props.test.tsx`):
   - view `{read()}` re-renders after the store changes;
   - child component with `label: bind(() => String(read()))` shows the new value;
   - listener count goes 0 -> 1 on mount, back to 0 on unmount;
   - calling `read()` outside a reaction returns the snapshot and does not subscribe.
3. Docs:
   - `docs/topic--05-api-reference.md`: entry for `fromExternalStore` (signature, semantics, example with a
     module-level service).
   - `docs/topic--04-react-integration.md`: short section "External state in views".
   - `AGENTS.md` dev guide (outside the managed block), "State and Reactivity Rules": external state is read through
     `fromExternalStore`, never via direct MobX.
4. Version: minor bump (1.9.3 -> 1.10.0) then `pnpm run version:sync` from `src/` (see root
   `docs/topic--setup-and-workflow.md`); do not publish.
5. `pnpm run typecheck`, `pnpm run test`, `pnpm run lint` in the package; commit via `/along-commit` bound to
   `external-store-reader`; `along wrap external-store-reader`.
