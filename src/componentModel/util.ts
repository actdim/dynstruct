export function capitalize(name: string) {
    return name.replace(/^./, name[0].toUpperCase());
}

/**
 * True for objects owned by React: elements, portals, `memo` / `forwardRef` / `lazy` component types,
 * contexts. React marks all of them with a symbol `$$typeof`. Such values are opaque to dynstruct:
 * they must be passed and stored by reference, never wrapped, converted to observables or proxied.
 */
export function isReactObject(value: unknown): value is object {
    return (
        value !== null &&
        typeof value === 'object' &&
        typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol'
    );
}