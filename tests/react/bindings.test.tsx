import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { bind, bindProp } from '@/componentModel/core';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    ValueConverter,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct<any>;
const msgBus = createMsgBus<TestMsgStruct, any>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

describe('Data Bindings (bind, bindProp, ValueConverter)', () => {
    type BoundStruct = ComponentStruct<TestMsgStruct, {
        props: {
            title: string;
            score: number;
        };
        actions: {
            setTitle: (t: string) => void;
            setScore: (s: number) => void;
        };
    }>;

    const useBoundComp = (params?: ComponentParams<BoundStruct>) => {
        let c: Component<BoundStruct>;
        let m: ComponentModel<BoundStruct>;
        const def: ComponentDef<BoundStruct> = {
            regType: 'BoundComp',
            props: {
                title: '',
                score: 0,
            },
            actions: {
                setTitle: (t) => { m.title = t; },
                setScore: (s) => { m.score = s; },
            },
            view: () => (
                <div>
                    <span data-testid="bound-title">{m.title}</span>
                    <span data-testid="bound-score">{m.score}</span>
                </div>
            ),
        };
        c = useComponent(def, params);
        m = c.model;
        return c;
    };

    it('binds two-way with external getter and setter', async () => {
        let externalTitle = 'Initial External';
        const titleBinding = bind(
            () => externalTitle,
            (newVal) => { externalTitle = newVal; },
        );

        let captured: ComponentModel<BoundStruct>;
        const BoundView = toReact<BoundStruct>((p) => {
            const c = useBoundComp(p);
            captured = c.model;
            return c;
        });

        wrap(<BoundView title={titleBinding} />);
        expect(screen.getByTestId('bound-title')).toHaveTextContent('Initial External');

        await act(async () => {
            captured.setTitle('Updated via Model');
        });
        expect(externalTitle).toBe('Updated via Model');
        expect(screen.getByTestId('bound-title')).toHaveTextContent('Updated via Model');
    });

    it('binds to nested properties via bindProp', async () => {
        const externalStore = {
            settings: {
                profile: {
                    displayName: 'Alice',
                },
            },
        };

        const propBinding = bindProp(() => externalStore, 'settings.profile.displayName');

        let captured: ComponentModel<BoundStruct>;
        const BoundView = toReact<BoundStruct>((p) => {
            const c = useBoundComp(p);
            captured = c.model;
            return c;
        });

        wrap(<BoundView title={propBinding} />);
        expect(screen.getByTestId('bound-title')).toHaveTextContent('Alice');

        await act(async () => {
            captured.setTitle('Bob');
        });
        expect(externalStore.settings.profile.displayName).toBe('Bob');
        expect(screen.getByTestId('bound-title')).toHaveTextContent('Bob');
    });

    it('transforms values using ValueConverter (convert and convertBack)', async () => {
        let rawCents = 2500;

        const centsToDollarsConverter: ValueConverter<number, number> = {
            convert: (cents) => cents / 100,
            convertBack: (dollars) => Math.round(dollars * 100),
        };

        const scoreBinding = bind(
            () => rawCents,
            (newCents) => { rawCents = newCents; },
            centsToDollarsConverter,
        );

        let captured: ComponentModel<BoundStruct>;
        const BoundView = toReact<BoundStruct>((p) => {
            const c = useBoundComp(p);
            captured = c.model;
            return c;
        });

        wrap(<BoundView score={scoreBinding} />);
        expect(screen.getByTestId('bound-score')).toHaveTextContent('25');

        await act(async () => {
            captured.setScore(49.99);
        });
        expect(rawCents).toBe(4999);
        expect(screen.getByTestId('bound-score')).toHaveTextContent('49.99');
    });

    it('supports read-only bindings', () => {
        let readOnlyValue = 'Constant Value';
        const roBinding = bind(() => readOnlyValue);

        expect(roBinding.readOnly).toBe(true);
        expect(roBinding.get()).toBe('Constant Value');
        expect(roBinding.set).toBeUndefined();
    });
});

