export type TypeRegistry<T extends Record<symbol, any>[]> =
    T extends [infer First, ...infer Rest extends Record<symbol, any>[]]
    ? First & TypeRegistry<Rest>
    : {};
