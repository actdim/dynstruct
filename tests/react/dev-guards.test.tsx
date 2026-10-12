import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { useComponent } from '@/componentModel/react/hooks';
import { bind, prop } from '@/componentModel/core';
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

describe('param targeting a prop declared through a getter', () => {
    type S = ComponentStruct<TestMsgStruct, {
        props: { label: string; title: string };
    }>;

    function create(params: ComponentParams<S>) {
        let model: ComponentModel<S> | undefined;
        const useLabeled = (p: ComponentParams<S>) => {
            let c: Component<S>;
            let m: ComponentModel<S>;
            const def: ComponentDef<S> = {
                regType: 'Labeled',
                props: {
                    // a getter returning a ComponentProp is a regular prop, not a computed one
                    get label() {
                        return prop({ initialValue: 'default', reactive: 'ref' });
                    },
                    get title() {
                        return prop({ initialValue: 'default' });
                    },
                },
                view: () => <span>{m.label}</span>,
            };
            c = useComponent(def, p);
            m = c.model;
            model = m;

            return c;
        };
        const Host = () => {
            const c = useLabeled(params);

            return <c.View />;
        };
        render(
            <ComponentContextProvider value={{ msgBus }}>
                <Host />
            </ComponentContextProvider>,
        );

        return model!;
    }

    it('takes a plain param without the computed-prop warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const model = create({ label: 'from param', title: 'title param' });
        expect(model.label).toBe('from param');
        expect(model.title).toBe('title param');
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('computed prop'));
    });

    it('takes a binding param', () => {
        const model = create({ label: bind(() => 'bound'), title: 'x' });
        expect(model.label).toBe('bound');
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
