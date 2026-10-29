import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { bind, fromExternalStore } from '@/componentModel/core';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

function createTestStore<T>(initialValue: T) {
    let value = initialValue;
    const listeners = new Set<() => void>();

    return {
        getSnapshot: () => value,
        set: (next: T) => {
            value = next;
            listeners.forEach((l) => l());
        },
        subscribe: (onChange: () => void) => {
            listeners.add(onChange);
            return () => {
                listeners.delete(onChange);
            };
        },
        getListenerCount: () => listeners.size,
    };
}

describe('fromExternalStore', () => {
    it('re-renders view when external store changes', async () => {
        const store = createTestStore('initial-value');
        const read = fromExternalStore(store.subscribe, store.getSnapshot, 'testStore');

        type CompStruct = ComponentStruct<TestMsgStruct, {}>;
        const useComp = (params?: ComponentParams<CompStruct>) => {
            const def: ComponentDef<CompStruct> = {
                regType: 'StoreReaderComp',
                view: () => <span data-testid="store-val">{read()}</span>,
            };
            return useComponent(def, params);
        };
        const Comp = toReact(useComp);

        wrap(<Comp />);
        expect(screen.getByTestId('store-val')).toHaveTextContent('initial-value');

        await act(async () => {
            store.set('updated-value');
        });
        expect(screen.getByTestId('store-val')).toHaveTextContent('updated-value');
    });

    it('updates child component prop bound to external store reader', async () => {
        const store = createTestStore(42);
        const read = fromExternalStore(store.subscribe, store.getSnapshot, 'numberStore');

        type ChildStruct = ComponentStruct<TestMsgStruct, {
            props: { label: string };
        }>;
        const useChild = (params?: ComponentParams<ChildStruct>) => {
            let c: Component<ChildStruct>;
            let m: ComponentModel<ChildStruct>;
            const def: ComponentDef<ChildStruct> = {
                regType: 'ChildComp',
                props: { label: '' },
                view: () => <span data-testid="child-label">{m.label}</span>,
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        };

        type ParentStruct = ComponentStruct<TestMsgStruct, {}>;
        const useParent = (params?: ComponentParams<ParentStruct>) => {
            let c: Component<ParentStruct>;
            const child = useChild({
                label: bind(() => String(read())),
            });
            const def: ComponentDef<ParentStruct> = {
                regType: 'ParentComp',
                view: () => (
                    <div>
                        <child.View />
                    </div>
                ),
            };
            c = useComponent(def, params);
            return c;
        };
        const ParentComp = toReact(useParent);

        wrap(<ParentComp />);
        expect(screen.getByTestId('child-label')).toHaveTextContent('42');

        await act(async () => {
            store.set(100);
        });
        expect(screen.getByTestId('child-label')).toHaveTextContent('100');
    });

    it('manages store subscription lifecycle: 0 on start, 1 on mount, 0 on unmount', async () => {
        const store = createTestStore('active');
        const read = fromExternalStore(store.subscribe, store.getSnapshot, 'lifecycleStore');

        expect(store.getListenerCount()).toBe(0);

        type LifecycleStruct = ComponentStruct<TestMsgStruct, {}>;
        const useLifecycleComp = (params?: ComponentParams<LifecycleStruct>) => {
            const def: ComponentDef<LifecycleStruct> = {
                regType: 'LifecycleComp',
                view: () => <span data-testid="life-val">{read()}</span>,
            };
            return useComponent(def, params);
        };
        const LifecycleComp = toReact(useLifecycleComp);

        const { unmount } = wrap(<LifecycleComp />);
        expect(screen.getByTestId('life-val')).toHaveTextContent('active');
        expect(store.getListenerCount()).toBe(1);

        unmount();
        expect(store.getListenerCount()).toBe(0);
    });

    it('returns snapshot and does not subscribe when called outside a reaction', () => {
        const store = createTestStore('hello');
        const read = fromExternalStore(store.subscribe, store.getSnapshot, 'outsideStore');

        expect(store.getListenerCount()).toBe(0);
        expect(read()).toBe('hello');
        expect(store.getListenerCount()).toBe(0);

        store.set('world');
        expect(read()).toBe('world');
        expect(store.getListenerCount()).toBe(0);
    });
});
