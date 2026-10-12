import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { useComponent } from '@/componentModel/react/hooks';
import type { Component, ComponentDef, ComponentModel, ComponentParams, ComponentStruct } from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

// DEV guards of the component model (bug--component-model-dev-guards).

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

afterEach(() => {
    vi.restoreAllMocks();
});

describe('plain param targeting a computed prop', () => {
    type S = ComponentStruct<TestMsgStruct, {
        props: { first: string; readonly full: string };
    }>;

    it('is ignored with a DEV warning instead of breaking creation', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        let model: ComponentModel<S> | undefined;
        const useNamed = (params: ComponentParams<S>) => {
            let c: Component<S>;
            let m: ComponentModel<S>;
            const def: ComponentDef<S> = {
                regType: 'Named',
                props: {
                    first: 'a',
                    get full() {
                        return `${m.first}!`;
                    },
                },
                view: () => <span data-testid='full'>{m.full}</span>,
            };
            c = useComponent(def, params);
            m = c.model;
            model = m;

            return c;
        };
        const Host = () => {
            const c = useNamed({ full: 'override' } as ComponentParams<S>);

            return <c.View />;
        };
        render(
            <ComponentContextProvider value={{ msgBus }}>
                <Host />
            </ComponentContextProvider>,
        );
        expect(model!.full).toBe('a!');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("computed prop 'full'"));
    });
});

describe('one View mounted twice', () => {
    type S = ComponentStruct<TestMsgStruct, { props: { x: string } }>;

    it('warns in DEV', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const useOne = (params: ComponentParams<S>) => {
            const def: ComponentDef<S> = { regType: 'One', props: { x: '' }, view: () => <span>one</span> };

            return useComponent(def, params);
        };
        const Host = () => {
            const c = useOne({});

            return (
                <>
                    <c.View />
                    <c.View />
                </>
            );
        };
        render(
            <ComponentContextProvider value={{ msgBus }}>
                <Host />
            </ComponentContextProvider>,
        );
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('mounted more than once'));
    });
});
