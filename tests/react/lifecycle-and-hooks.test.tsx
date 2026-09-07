import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { useDynamicContent } from '@/componentModel/DynamicContent';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

describe('Component Lifecycle and Execution Hooks', () => {
    type LifecycleStruct = ComponentStruct<TestMsgStruct, {
        props: { name: string };
    }>;

    it('executes lifecycle events in precise order: onInit -> onLayoutReady -> onReady -> onLayoutDestroy -> onDestroy', async () => {
        const lifecycleOrder: string[] = [];

        const useLifecycleComp = (params?: ComponentParams<LifecycleStruct>) => {
            let c: Component<LifecycleStruct>;
            const def: ComponentDef<LifecycleStruct> = {
                regType: 'LifecycleLoggerComp',
                props: { name: 'Initial' },
                events: {
                    onInit: () => { lifecycleOrder.push('onInit'); },
                    onLayoutReady: () => { lifecycleOrder.push('onLayoutReady'); },
                    onReady: () => { lifecycleOrder.push('onReady'); },
                    onLayoutDestroy: () => { lifecycleOrder.push('onLayoutDestroy'); },
                    onDestroy: () => { lifecycleOrder.push('onDestroy'); },
                },
                view: () => <div data-testid="lifecycle-node">Node</div>,
            };
            c = useComponent(def, params);
            return c;
        };

        const LifecycleNode = toReact(useLifecycleComp);

        const Wrapper = () => {
            const [mounted, setMounted] = useState(true);
            return (
                <div>
                    <button data-testid="unmount-btn" onClick={() => setMounted(false)}>
                        Unmount
                    </button>
                    {mounted && <LifecycleNode />}
                </div>
            );
        };

        wrap(<Wrapper />);

        expect(lifecycleOrder).toEqual(['onInit', 'onLayoutReady', 'onReady']);

        await act(async () => {
            screen.getByTestId('unmount-btn').click();
        });

        expect(lifecycleOrder).toEqual([
            'onInit',
            'onLayoutReady',
            'onReady',
            'onLayoutDestroy',
            'onDestroy',
        ]);
    });

    it('syncs updated params from parent re-render to model', async () => {
        type SyncStruct = ComponentStruct<TestMsgStruct, {
            props: { title: string };
        }>;

        let capturedComp: Component<SyncStruct>;

        const useSyncComp = (params?: ComponentParams<SyncStruct>) => {
            let c: Component<SyncStruct>;
            let m: ComponentModel<SyncStruct>;
            const def: ComponentDef<SyncStruct> = {
                regType: 'SyncComp',
                props: { title: 'Default' },
                view: () => <span data-testid="sync-title">{m.title}</span>,
            };
            c = useComponent(def, params);
            m = c.model;
            capturedComp = c;
            return c;
        };

        const SyncChild = toReact(useSyncComp);

        const ParentWrapper = () => {
            const [title, setTitle] = useState('First Title');
            return (
                <div>
                    <button data-testid="change-btn" onClick={() => setTitle('Second Title')}>
                        Change
                    </button>
                    <SyncChild title={title} />
                </div>
            );
        };

        wrap(<ParentWrapper />);
        expect(screen.getByTestId('sync-title')).toHaveTextContent('First Title');
        expect(capturedComp.model.title).toBe('First Title');

        const initialCompInstance = capturedComp;

        await act(async () => {
            screen.getByTestId('change-btn').click();
        });

        expect(capturedComp).toBe(initialCompInstance);
        expect(capturedComp.model.title).toBe('Second Title');
        expect(screen.getByTestId('sync-title')).toHaveTextContent('Second Title');
    });
});

describe('Dynamic Content Component (useDynamicContent)', () => {
    it('renders dynamic content function with supplied data', () => {
        const DynamicComp = toReact(useDynamicContent<{ message: string }>);

        wrap(
            <DynamicComp
                data={{ message: 'Hello Dynamic' }}
                render={(props, component) => (
                    <div data-testid="dynamic-out">
                        {component?.model.data?.message}
                    </div>
                )}
            />,
        );

        expect(screen.getByTestId('dynamic-out')).toHaveTextContent('Hello Dynamic');
    });
});

