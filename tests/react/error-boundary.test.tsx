import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { ErrorBoundary } from '@/componentModel/react/errorBoundary';
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

describe('ErrorBoundary and Fault Isolation', () => {
    it('catches render errors in ErrorBoundary and renders custom fallback', () => {
        const onCatchSpy = vi.fn();

        const ThrowingChild = () => {
            throw new Error('Explosion in Child Component');
        };

        wrap(
            <ErrorBoundary
                onCatch={onCatchSpy}
                fallback={(err: unknown) => (
                    <div data-testid="custom-fallback">
                        Caught: {err instanceof Error ? err.message : String(err)}
                    </div>
                )}
            >
                <ThrowingChild />
            </ErrorBoundary>,
        );

        expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Caught: Explosion in Child Component');
        expect(onCatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Explosion in Child Component' }),
            expect.anything(),
        );
    });

    it('renders def.fallbackView when component view throws', () => {
        type CrashingStruct = ComponentStruct<TestMsgStruct, {
            props: { shouldCrash: boolean };
        }>;

        const useCrashingComp = (params?: ComponentParams<CrashingStruct>) => {
            let c: Component<CrashingStruct>;
            let m: ComponentModel<CrashingStruct>;
            const def: ComponentDef<CrashingStruct> = {
                regType: 'CrashingComp',
                props: { shouldCrash: false },
                useErrorBoundary: true,
                fallbackView: (props, comp) => (
                    <div data-testid="def-fallback">
                        Fallback for {comp.id}
                    </div>
                ),
                view: () => {
                    if (m.shouldCrash) {
                        throw new Error('View Render Error');
                    }
                    return <div data-testid="normal-view">Normal View</div>;
                },
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        };

        const CrashingNode = toReact(useCrashingComp);

        wrap(<CrashingNode shouldCrash={true} />);

        expect(screen.getByTestId('def-fallback')).toBeInTheDocument();
        expect(screen.queryByTestId('normal-view')).not.toBeInTheDocument();
    });

    it('intercepts action errors and records in model.$.errors', async () => {
        type ActionErrStruct = ComponentStruct<TestMsgStruct, {
            props: { value: number };
            actions: { riskyAction: () => void };
        }>;

        let comp: Component<ActionErrStruct>;
        const onCatchSpy = vi.fn();

        const useActionErrComp = (params?: ComponentParams<ActionErrStruct>) => {
            let c: Component<ActionErrStruct>;
            const def: ComponentDef<ActionErrStruct> = {
                regType: 'ActionErrComp',
                props: { value: 0 },
                useErrorBoundary: false,
                actions: {
                    riskyAction: () => {
                        throw new Error('Action Failure');
                    },
                },
                view: () => <button data-testid="risk-btn" onClick={c.model.riskyAction}>Run</button>,
            };
            c = useComponent(def, params);
            comp = c;
            return c;
        };

        const ActionErrNode = toReact(useActionErrComp);

        wrap(
            <ActionErrNode
                $events={{
                    onCatch: (err) => onCatchSpy(err),
                }}
            />,
        );

        expect(comp.model.$.errors).toHaveLength(0);

        await act(async () => {
            screen.getByTestId('risk-btn').click();
        });

        expect(comp.model.$.errors.length).toBeGreaterThan(0);
        expect(onCatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Action Failure' }),
        );
    });
});

