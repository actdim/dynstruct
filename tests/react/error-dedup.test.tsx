import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { useComponent } from '@/componentModel/react/hooks';
import type { Component, ComponentDef, ComponentModel, ComponentParams, ComponentStruct } from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

// Error routing dedup: one report per propagation chain, the same error object in a new chain is reported again
// (bug--error-dedup-singleton-errors).

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

type S = ComponentStruct<TestMsgStruct, {
    props: { x: string };
    actions: {
        fail: () => void;
        outer: () => void;
        failAsync: () => Promise<void>;
        outerAsync: () => Promise<void>;
        touch: () => void;
    };
}>;

const SINGLETON = new Error('singleton failure');

function setup() {
    const onCatch = vi.fn();
    let instance: Component<S> | undefined;
    const useFailing = (params: ComponentParams<S>) => {
        let c: Component<S>;
        let m: ComponentModel<S>;
        const def: ComponentDef<S> = {
            regType: 'Failing',
            props: { x: '' },
            actions: {
                fail: () => {
                    throw SINGLETON;
                },
                outer: () => {
                    m.fail();
                },
                failAsync: async () => {
                    await Promise.resolve();
                    throw SINGLETON;
                },
                // the inner call runs after an await (run depth is back to 0), and another run (touch) happens
                // between the inner report and the outer rejection
                outerAsync: async () => {
                    await Promise.resolve();
                    try {
                        await m.failAsync();
                    } finally {
                        m.touch();
                    }
                },
                touch: () => {
                    m.x = 'touched';
                },
            },
            events: { onCatch },
            view: () => <span>x</span>,
        };
        c = useComponent(def, params);
        m = c.model;

        return c;
    };
    const Host = () => {
        const c = useFailing({});
        instance = c;

        return <c.View />;
    };
    render(
        <ComponentContextProvider value={{ msgBus }}>
            <Host />
        </ComponentContextProvider>,
    );

    return { onCatch, instance: instance! };
}

describe('run() error dedup', () => {
    it('reports the same error object again in a new chain', () => {
        const { onCatch, instance } = setup();
        expect(() => instance.model.fail()).toThrow(SINGLETON);
        expect(() => instance.model.fail()).toThrow(SINGLETON);
        expect(onCatch).toHaveBeenCalledTimes(2);
    });

    it('reports a nested rethrow once', () => {
        const { onCatch, instance } = setup();
        expect(() => instance.model.outer()).toThrow(SINGLETON);
        expect(onCatch).toHaveBeenCalledTimes(1);
    });

    it('reports an async nested rethrow once', async () => {
        const { onCatch, instance } = setup();
        await expect(instance.model.outerAsync()).rejects.toBe(SINGLETON);
        expect(onCatch).toHaveBeenCalledTimes(1);
    });

    it('reports concurrent async calls failing with the same error object', async () => {
        const { onCatch, instance } = setup();
        const first = instance.model.failAsync();
        const second = instance.model.failAsync();
        await expect(first).rejects.toBe(SINGLETON);
        await expect(second).rejects.toBe(SINGLETON);
        expect(onCatch).toHaveBeenCalledTimes(2);
    });

    it('reports the same async error again in a later call', async () => {
        const { onCatch, instance } = setup();
        await expect(instance.model.failAsync()).rejects.toBe(SINGLETON);
        await expect(instance.model.failAsync()).rejects.toBe(SINGLETON);
        expect(onCatch).toHaveBeenCalledTimes(2);
    });
});
