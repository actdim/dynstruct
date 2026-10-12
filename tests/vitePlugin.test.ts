import { describe, it, expect } from 'vitest';
import { parseAst } from 'vite';
import { injectRegTypes, moduleBaseName, regTypeFromFunctionName } from '@/vite/plugin';
import { parseStackFrameLocation } from '@/componentModel/core';

const parse = (code: string) => parseAst(code);

function transform(code: string, id = '/src/features/Card.tsx') {
    return injectRegTypes(code, id, parse)?.code ?? null;
}

describe('dynstruct Vite plugin: regType injection', () => {
    it('uses the hook name without "use" for const arrow hook-constructors', () => {
        const out = transform(
            [
                "import { useComponent } from '@actdim/dynstruct/componentModel/react/hooks';",
                'export const useStorageCard = (params) => {',
                '    const def = {};',
                '    const c = useComponent(def, params);',
                '    return c;',
                '};',
            ].join('\n'),
        );
        expect(out).toContain('useComponent(def, params, undefined, { regType: "StorageCard" })');
    });

    it('handles function declarations, a third argument and import aliases', () => {
        const out = transform(
            [
                "import { useComponent as uc } from '@/componentModel/react/hooks';",
                'export function useStore(params) {',
                '    return uc(def, params, { cache: true });',
                '}',
            ].join('\n'),
        );
        expect(out).toContain('uc(def, params, { cache: true }, { regType: "Store" })');
    });

    it('takes the nearest named enclosing function (inner arrows are skipped)', () => {
        const out = transform(
            [
                "import { useComponent } from 'x/react/hooks';",
                'const useOuter = (params) => {',
                '    const make = () => useComponent(def, params);',
                '    return make();',
                '};',
            ].join('\n'),
        );
        expect(out).toContain('{ regType: "Outer" }');
    });

    it('names a member function (factory child) after its key, not after the enclosing hook', () => {
        const out = transform(
            [
                "import { useComponent } from 'h';",
                'const useParent = (params) => {',
                '    const def = { children: { storageCard: (p) => useComponent(cardDef, p) } };',
                '    return useComponent(def, params);',
                '};',
            ].join('\n'),
        );
        expect(out).toContain('useComponent(cardDef, p, undefined, { regType: "StorageCard" })');
        expect(out).toContain('useComponent(def, params, undefined, { regType: "Parent" })');
    });

    it('uses a PascalCase function name as is and falls back to the module name', () => {
        const pascal = transform(
            ["import { useComponent } from 'h';", 'function Panel(params) { return useComponent(def, params); }'].join('\n'),
        );
        expect(pascal).toContain('{ regType: "Panel" }');
        const anonymous = transform(
            ["import { useComponent } from 'h';", 'export default (params) => useComponent(def, params);'].join('\n'),
            '/src/features/Widget.tsx?v=123',
        );
        expect(anonymous).toContain('{ regType: "Widget" }');
    });

    it('leaves calls with metadata, spreads and modules without the import untouched', () => {
        expect(
            transform(["import { useComponent } from 'h';", 'const useA = (p) => useComponent(d, p, i, m);'].join('\n')),
        ).toBeNull();
        expect(transform(["import { useComponent } from 'h';", 'const useA = (p) => useComponent(...args);'].join('\n'))).toBeNull();
        expect(transform('const useA = (p) => useComponent(d, p);')).toBeNull();
    });

    it('produces a source map', () => {
        const result = injectRegTypes(
            ["import { useComponent } from 'h';", 'const useA = (p) => useComponent(d, p);'].join('\n'),
            '/src/A.tsx',
            parse,
        );
        expect(result?.map.mappings.length).toBeGreaterThan(0);
    });

    it('name helpers', () => {
        expect(regTypeFromFunctionName('useCard')).toBe('Card');
        expect(regTypeFromFunctionName('Card')).toBe('Card');
        expect(regTypeFromFunctionName('helper')).toBeUndefined();
        expect(regTypeFromFunctionName('user')).toBeUndefined();
        expect(moduleBaseName('C:\\src\\Card.view.tsx')).toBe('Card.view');
    });
});

describe('parseStackFrameLocation', () => {
    it('parses V8 frames', () => {
        expect(parseStackFrameLocation('    at useCard (http://localhost:5173/src/Card.tsx?t=17:12:5)')).toBe(
            'http://localhost:5173/src/Card.tsx:12:5',
        );
        expect(parseStackFrameLocation('    at http://localhost:5173/src/Card.tsx:12:5')).toBe(
            'http://localhost:5173/src/Card.tsx:12:5',
        );
    });

    it('parses Firefox / Safari frames', () => {
        expect(parseStackFrameLocation('useCard@http://localhost:5173/src/Card.tsx?t=17:12:5')).toBe(
            'http://localhost:5173/src/Card.tsx:12:5',
        );
        expect(parseStackFrameLocation('@http://localhost:5173/src/Card.tsx:12:5')).toBe(
            'http://localhost:5173/src/Card.tsx:12:5',
        );
    });

    it('returns null for headers and unknown lines', () => {
        expect(parseStackFrameLocation('Error')).toBeNull();
        expect(parseStackFrameLocation('    at new Promise (<anonymous>)')).toBeNull();
        expect(parseStackFrameLocation('')).toBeNull();
    });
});
