import { describe, it, expect } from 'vitest';
import { observable } from 'mobx';
import { normalizePayload } from '@/componentModel/core';

// c.msgBus payload normalization (bug--normalize-payload-class-instances): observables are converted to plain
// values, class instances are passed as is.

describe('normalizePayload', () => {
    it('keeps class instances (File, Date, Map) by reference', () => {
        const file = new File(['x'], 'a.txt');
        const date = new Date(0);
        const map = new Map([['k', 1]]);
        const payload = normalizePayload({ files: [file], date, map });

        expect(payload.files[0]).toBe(file);
        expect(payload.date).toBe(date);
        expect(payload.map).toBe(map);
    });

    it('keeps a top-level class instance', () => {
        const blob = new Blob(['x']);

        expect(normalizePayload(blob)).toBe(blob);
    });

    it('still converts observables and copies plain objects', () => {
        const nested = { a: 1 };
        const state = observable({ items: [{ id: 1 }] });
        const payload = normalizePayload({ nested, state });

        expect(payload.nested).toEqual({ a: 1 });
        expect(payload.nested).not.toBe(nested);
        expect(payload.state).toEqual({ items: [{ id: 1 }] });
    });
});
