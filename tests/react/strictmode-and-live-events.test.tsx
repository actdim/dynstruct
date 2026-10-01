import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type MsgStruct } from '@actdim/msgmesh/contracts';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = MsgStruct<{
    'STRICT.EVENT': {
        in: { info: string };
    };
}> & BaseAppMsgStruct;

const msgBus = createMsgBus<TestMsgStruct>();

const flush = () => new Promise((res) => setTimeout(res, 20));

async function sendEvent(info: string) {
    await act(async () => {
        msgBus.send({ channel: 'STRICT.EVENT', group: 'in', payload: { info } });
    });
    await flush();
}

describe('StrictMode lifecycle', () => {
    type SubStruct = ComponentStruct<TestMsgStruct, {
        props: { label: string };
        msgScope: {
            subscribe: 'STRICT.EVENT';
        };
    }>;

    it('keeps the instance and a live subscription across the simulated re-mount', async () => {
        const received: string[] = [];
        let last: Component<SubStruct>;

        const useSub = (params?: ComponentParams<SubStruct>) => {
            let c: Component<SubStruct>;
            const def: ComponentDef<SubStruct> = {
                regType: 'StrictSub',
                props: { label: '' },
                msgBroker: {
                    subscribe: {
                        'STRICT.EVENT': {
                            in: {
                                callback: (msg) => {
                                    received.push(msg.payload.info);
                                },
                            },
                        },
                    },
                },
                view: () => <div>{c.model.label}</div>,
            };
            c = useComponent(def, params);
            last = c;
            return c;
        };
        const Sub = toReact(useSub);

        const tree = (label: string) => (
            <React.StrictMode>
                <ComponentContextProvider value={{ msgBus }}>
                    <Sub label={label} />
                </ComponentContextProvider>
            </React.StrictMode>
        );

        const { rerender, unmount } = render(tree('a'));
        const mounted = last;
        expect(mounted.abortSignal?.aborted).toBe(false);

        await sendEvent('first');
        expect(received).toEqual(['first']);

        rerender(tree('b'));
        expect(last).toBe(mounted);
        expect(mounted.model.label).toBe('b');

        unmount();
        expect(mounted.abortSignal?.aborted).toBe(true);

        await sendEvent('after-unmount');
        expect(received).toEqual(['first']);
    });
});

describe('Live params.$events', () => {
    type ValueStruct = ComponentStruct<TestMsgStruct, {
        props: { value: string };
    }>;

    const useValue = (params?: ComponentParams<ValueStruct>) => {
        let c: Component<ValueStruct>;
        let m: ComponentModel<ValueStruct>;
        const def: ComponentDef<ValueStruct> = {
            regType: 'LiveEventsComp',
            props: { value: '' },
            view: () => <span>{m.value}</span>,
        };
        c = useComponent(def, params);
        m = c.model;
        return c;
    };
    const Value = toReact(useValue);

    function tree(params: ComponentParams<ValueStruct>) {
        return (
            <ComponentContextProvider value={{ msgBus }}>
                <Value {...params} />
            </ComponentContextProvider>
        );
    }

    it('calls handlers supplied or replaced on later renders', () => {
        const onChangeValue1 = vi.fn();
        const onChangeValue2 = vi.fn();
        const onPropChange = vi.fn();
        const onGetValue = vi.fn(() => 'from-getter');
        const onDestroy1 = vi.fn();
        const onDestroy2 = vi.fn();

        const { rerender, unmount, container } = render(
            tree({ value: 'a', $events: { onChangeValue: onChangeValue1, onDestroy: onDestroy1 } }),
        );

        // onPropChange appears only on the second render
        rerender(
            tree({
                value: 'b',
                $events: { onChangeValue: onChangeValue2, onPropChange, onDestroy: onDestroy2 },
            }),
        );
        expect(onChangeValue1).not.toHaveBeenCalled();
        expect(onChangeValue2).toHaveBeenCalledWith('b');
        expect(onPropChange).toHaveBeenCalledWith('value', 'b');

        // onGetX appears later too
        rerender(tree({ value: 'b', $events: { onGetValue, onDestroy: onDestroy2 } }));
        rerender(tree({ value: 'c', $events: { onGetValue, onDestroy: onDestroy2 } }));
        expect(container).toHaveTextContent('from-getter');

        // re-renders must not restart the lifecycle
        expect(onDestroy2).not.toHaveBeenCalled();
        unmount();
        expect(onDestroy1).not.toHaveBeenCalled();
        expect(onDestroy2).toHaveBeenCalledTimes(1);
    });

    it('does not remount the view on re-renders (error boundary tree stays stable)', () => {
        const onReady = vi.fn();
        const onDestroy = vi.fn();
        const events = { onReady, onDestroy };
        const { rerender, unmount } = render(tree({ value: 'a', $events: events }));
        rerender(tree({ value: 'b', $events: events }));
        rerender(tree({ value: 'c', $events: events }));
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(onDestroy).not.toHaveBeenCalled();
        unmount();
        expect(onDestroy).toHaveBeenCalledTimes(1);
    });
});
