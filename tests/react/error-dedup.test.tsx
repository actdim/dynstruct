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
    actions: { fail: () => void; outer: () => void };
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
});
