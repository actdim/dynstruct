import MagicString from 'magic-string';

/**
 * Vite plugin: derives a component's `regType` from the source at build time.
 *
 * For every `useComponent(...)` call it appends the build-time metadata argument
 * (`useComponent(def, params, internals, { regType })`) with a name taken from the nearest enclosing named
 * function: `useStorageCard` -> `'StorageCard'`, a PascalCase function as is, otherwise the module file name.
 * An explicit `def.regType` still wins at runtime. Works in dev, build and Vitest; runs after TS/JSX transforms.
 *
 * ```ts
 * import { dynstructPlugin } from '@actdim/dynstruct/vite/plugin';
 * export default defineConfig({ plugins: [react(), dynstructPlugin()] });
 * ```
 */
export type DynstructPluginOptions = {
    /** Files to transform (tested against the module id without query). Default: JS/TS modules. */
    include?: RegExp;
    /** Files to skip. Default: `node_modules`. */
    exclude?: RegExp;
};

type AstNode = {
    type: string;
    start: number;
    end: number;
    [key: string]: unknown;
};

const USE_COMPONENT = 'useComponent';

function isNode(value: unknown): value is AstNode {
    return typeof value === 'object' && value !== null && typeof (value as AstNode).type === 'string';
}

/** Name used as regType for the function `name`, or `undefined` when the name does not identify a component. */
export function regTypeFromFunctionName(name: string | undefined): string | undefined {
    if (!name) {
        return undefined;
    }
    const hook = name.match(/^use([A-Z].*)$/);
    if (hook) {
        return hook[1];
    }

    return /^[A-Z]/.test(name) ? name : undefined;
}

/** Module file name without extension: `/src/features/Card.tsx?v=1` -> `Card`. */
export function moduleBaseName(id: string): string {
    const file = id.split('?')[0].split(/[\\/]/).pop() ?? id;

    return file.replace(/\.[^.]+$/, '');
}

function keyName(key: AstNode | undefined): string | undefined {
    if (key?.type === 'Identifier') {
        return key.name as string;
    }

    return key?.type === 'Literal' && typeof key.value === 'string' ? key.value : undefined;
}

/** Name of a function used as an object member (`children: { card: (p) => ... }`, methods): its key, capitalized. */
function memberFunctionName(node: AstNode, parent: AstNode | undefined): string | undefined {
    const isMember =
        (parent?.type === 'Property' && parent.value === node) ||
        (parent?.type === 'MethodDefinition' && parent.value === node) ||
        (parent?.type === 'PropertyDefinition' && parent.value === node);
    if (!isMember) {
        return undefined;
    }
    const key = keyName(parent.key as AstNode);

    return key ? key.charAt(0).toUpperCase() + key.slice(1) : undefined;
}

function functionName(node: AstNode, parent: AstNode | undefined): string | undefined {
    const id = node.id as AstNode | null | undefined;
    if (id && id.type === 'Identifier') {
        return id.name as string;
    }
    // a member function is its own component boundary (e.g. a factory child): named after its key
    const member = memberFunctionName(node, parent);
    if (member) {
        return member;
    }
    // const useXxx = () => {...} / const useXxx = function () {...}
    if (parent?.type === 'VariableDeclarator') {
        const declId = parent.id as AstNode;
        if (declId.type === 'Identifier') {
            return declId.name as string;
        }
    }

    return undefined;
}

/** Local names bound to the imported `useComponent` (handles `import { useComponent as uc }`). */
function useComponentLocalNames(program: AstNode): Set<string> {
    const names = new Set<string>();
    for (const statement of program.body as AstNode[]) {
        if (statement.type !== 'ImportDeclaration') {
            continue;
        }
        for (const specifier of statement.specifiers as AstNode[]) {
            const imported = specifier.imported as AstNode | undefined;
            if (specifier.type === 'ImportSpecifier' && imported?.name === USE_COMPONENT) {
                names.add((specifier.local as AstNode).name as string);
            }
        }
    }

    return names;
}

/**
 * Appends the metadata argument to `useComponent` calls in `code`. Returns `null` when nothing changed.
 * `parse` must return an ESTree program with `start` / `end` offsets (Vite/Rollup `this.parse`).
 */
export function injectRegTypes(
    code: string,
    id: string,
    parse: (code: string) => unknown,
): { code: string; map: ReturnType<MagicString['generateMap']> } | null {
    if (!code.includes(USE_COMPONENT)) {
        return null;
    }
    let program: unknown;
    try {
        program = parse(code);
    } catch {
        return null;
    }
    if (!isNode(program)) {
        return null;
    }
    const callees = useComponentLocalNames(program);
    if (callees.size === 0) {
        return null;
    }
    const s = new MagicString(code);
    const fallback = moduleBaseName(id);
    // names of the enclosing functions, innermost last
    const scope: Array<string | undefined> = [];

    const visit = (node: AstNode, parent: AstNode | undefined) => {
        const isFunction =
            node.type === 'FunctionDeclaration' ||
            node.type === 'FunctionExpression' ||
            node.type === 'ArrowFunctionExpression';
        if (isFunction) {
            scope.push(functionName(node, parent));
        }
        if (node.type === 'CallExpression') {
            const callee = node.callee as AstNode;
            const args = node.arguments as AstNode[];
            if (
                callee.type === 'Identifier' &&
                callees.has(callee.name as string) &&
                (args.length === 2 || args.length === 3) &&
                !args.some((arg) => arg.type === 'SpreadElement')
            ) {
                const named = [...scope].reverse().map(regTypeFromFunctionName).find(Boolean);
                const meta = `{ regType: ${JSON.stringify(named ?? fallback)} }`;
                const last = args[args.length - 1];
                s.appendLeft(last.end, args.length === 2 ? `, undefined, ${meta}` : `, ${meta}`);
            }
        }
        for (const key of Object.keys(node)) {
            const value = node[key];
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (isNode(item)) {
                        visit(item, node);
                    }
                }
            } else if (isNode(value)) {
                visit(value, node);
            }
        }
        if (isFunction) {
            scope.pop();
        }
    };
    visit(program, undefined);

    if (!s.hasChanged()) {
        return null;
    }

    return {
        code: s.toString(),
        map: s.generateMap({ source: id.split('?')[0], includeContent: true, hires: 'boundary' }),
    };
}

type TransformResult = ReturnType<typeof injectRegTypes>;

/**
 * Structural plugin type: assignable to the `Plugin` of any installed Vite / Rollup version, so consumers do not depend
 * on the exact `vite` type instance resolved by this package (duplicate `vite` type copies in a workspace would make
 * `Plugin` from here incompatible with the consumer's `PluginOption`).
 */
export type DynstructVitePlugin = {
    name: string;
    enforce: 'post';
    transform: (this: { parse: (code: string) => unknown }, code: string, id: string) => TransformResult;
};

export function dynstructPlugin(options: DynstructPluginOptions = {}): DynstructVitePlugin {
    const include = options.include ?? /\.[cm]?[jt]sx?$/;
    const exclude = options.exclude ?? /[\\/]node_modules[\\/]/;

    return {
        name: 'dynstruct:reg-type',
        // after TS/JSX transforms: the plugin parses plain JS
        enforce: 'post',
        transform(code, id) {
            const file = id.split('?')[0];
            if (!include.test(file) || exclude.test(file)) {
                return null;
            }

            return injectRegTypes(code, id, (source) => this.parse(source));
        },
    };
}
