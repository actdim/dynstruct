import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { ComponentMsgFilter } from '@/componentModel/contracts';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct<{
    'CUSTOM.GREET': {
        in: { name: string };
        out: { reply: string };
    };
    'CUSTOM.SLOW': {
        in: {};
        out: { ok: boolean };
    };
    'CUSTOM.EVENT': {
        in: { info: string };
    };
}>;

const msgBus = createMsgBus<TestMsgStruct, any>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

describe('MsgBroker and MsgMesh Integration', () => {
    type ProviderStruct = ComponentStruct<TestMsgStruct, {
        props: { prefix: string };
        msgScope: {
            provide: 'CUSTOM.GREET';
        };
    }>;

    type ConsumerStruct = ComponentStruct<TestMsgStruct, {
        props: { receivedReply: string };
        actions: {
            sendRequest: () => Promise<void>;
        };
        msgScope: {
            publish: 'CUSTOM.GREET';
        };
    }>;

    it('handles request-response via msgBroker.provide and sends sourceId in headers', async () => {
        let consumerComp: Component<ConsumerStruct>;

        const useProvider = (params?: ComponentParams<ProviderStruct>) => {
            let c: Component<ProviderStruct>;
            let m: ComponentModel<ProviderStruct>;
            const def: ComponentDef<ProviderStruct> = {
                regType: 'GreetProvider',
                props: { prefix: 'Hello' },
                msgBroker: {
                    provide: {
                        'CUSTOM.GREET': {
                            in: {
                                callback: (msg) => {
                                    return { reply: `${m.prefix}, ${msg.payload.name} from ${msg.headers?.sourceId}` };
                                },
                            },
                        },
                    },
                },
                view: () => <div>Provider</div>,
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        };

        const useConsumer = (params?: ComponentParams<ConsumerStruct>) => {
            let c: Component<ConsumerStruct>;
            let m: ComponentModel<ConsumerStruct>;
            const def: ComponentDef<ConsumerStruct> = {
                regType: 'GreetConsumer',
                props: { receivedReply: '' },
                actions: {
                    sendRequest: async () => {
                        const res = await c.msgBus.request({
                            channel: 'CUSTOM.GREET',
                            group: 'in',
                            payload: { name: 'Alice' },
                        });
                        m.receivedReply = res.payload.reply;
                    },
                },
                view: () => (
                    <div>
                        <span data-testid="reply-text">{m.receivedReply}</span>
                        <button data-testid="send-req-btn" onClick={m.sendRequest}>Request</button>
                    </div>
                ),
            };
            c = useComponent(def, params);
            m = c.model;
            consumerComp = c;
            return c;
        };

        const ProviderView = toReact(useProvider);
        const ConsumerView = toReact(useConsumer);

        wrap(
            <div>
                <ProviderView />
                <ConsumerView />
            </div>,
        );

        await act(async () => {
            screen.getByTestId('send-req-btn').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('reply-text')).toHaveTextContent(
                `Hello, Alice from ${consumerComp.id}`,
            );
        });
    });

    it('tracks pendingRequestCount during msgBus.request', async () => {
        type SlowProviderStruct = ComponentStruct<TestMsgStruct, {
            props: {};
            msgScope: {
                provide: 'CUSTOM.SLOW';
            };
        }>;

        type SlowConsumerStruct = ComponentStruct<TestMsgStruct, {
            props: { done: boolean };
            actions: {
                sendSlowRequest: () => Promise<void>;
            };
            msgScope: {
                publish: 'CUSTOM.SLOW';
            };
        }>;

        let consumerComp: Component<SlowConsumerStruct>;

        const useSlowProvider = (params?: ComponentParams<SlowProviderStruct>) => {
            let c: Component<SlowProviderStruct>;
            const def: ComponentDef<SlowProviderStruct> = {
                regType: 'SlowProvider',
                props: {},
                msgBroker: {
                    provide: {
                        'CUSTOM.SLOW': {
                            in: {
                                callback: async () => {
                                    await new Promise((res) => setTimeout(res, 50));
                                    return { ok: true };
                                },
                            },
                        },
                    },
                },
                view: () => <div>Slow Provider</div>,
            };
            c = useComponent(def, params);
            return c;
        };

        const useSlowConsumer = (params?: ComponentParams<SlowConsumerStruct>) => {
            let c: Component<SlowConsumerStruct>;
            let m: ComponentModel<SlowConsumerStruct>;
            const def: ComponentDef<SlowConsumerStruct> = {
                regType: 'SlowConsumer',
                props: { done: false },
                actions: {
                    sendSlowRequest: async () => {
                        await c.msgBus.request({
                            channel: 'CUSTOM.SLOW',
                            group: 'in',
                            payload: {},
                        });
                        m.done = true;
                    },
                },
                view: () => <div>Slow Consumer</div>,
            };
            c = useComponent(def, params);
            m = c.model;
            consumerComp = c;
            return c;
        };

        const ProviderView = toReact(useSlowProvider);
        const ConsumerView = toReact(useSlowConsumer);

        wrap(
            <div>
                <ProviderView />
                <ConsumerView />
            </div>,
        );

        expect(consumerComp.model.$.pendingRequestCount).toBe(0);

        let reqPromise: Promise<void>;
        act(() => {
            reqPromise = consumerComp.model.sendSlowRequest();
        });

        expect(consumerComp.model.$.pendingRequestCount).toBe(1);

        await act(async () => {
            await reqPromise;
        });

        expect(consumerComp.model.$.pendingRequestCount).toBe(0);
        expect(consumerComp.model.done).toBe(true);
    });

    it('filters messages with ComponentMsgFilter.FromAncestors', async () => {
        const receivedMessages: string[] = [];

        type FilterStruct = ComponentStruct<TestMsgStruct, {
            props: { name: string };
            actions: {
                sendEvent: (msg: string) => void;
            };
            msgScope: {
                subscribe: 'CUSTOM.EVENT';
                publish: 'CUSTOM.EVENT';
            };
        }>;

        let parentComp: Component<FilterStruct>;
        let strangerComp: Component<FilterStruct>;

        const useChild = (params?: ComponentParams<FilterStruct>) => {
            let c: Component<FilterStruct>;
            const def: ComponentDef<FilterStruct> = {
                regType: 'ChildFilteredNode',
                props: { name: 'Child' },
                actions: { sendEvent: () => {} },
                msgBroker: {
                    subscribe: {
                        'CUSTOM.EVENT': {
                            in: {
                                componentFilter: ComponentMsgFilter.FromAncestors,
                                callback: (msg) => {
                                    receivedMessages.push(msg.payload.info);
                                },
                            },
                        },
                    },
                },
                view: () => <div>Child Node</div>,
            };
            c = useComponent(def, params);
            return c;
        };
        const Child = toReact(useChild);

        const useParent = (params?: ComponentParams<FilterStruct>) => {
            let c: Component<FilterStruct>;
            const def: ComponentDef<FilterStruct> = {
                regType: 'ParentNode',
                props: { name: 'Parent' },
                actions: {
                    sendEvent: (info) => {
                        c.msgBus.send({
                            channel: 'CUSTOM.EVENT',
                            group: 'in',
                            payload: { info },
                        });
                    },
                },
                view: () => (
                    <div>
                        <Child />
                    </div>
                ),
            };
            c = useComponent(def, params);
            parentComp = c;
            return c;
        };
        const Parent = toReact(useParent);

        const useStranger = (params?: ComponentParams<FilterStruct>) => {
            let c: Component<FilterStruct>;
            const def: ComponentDef<FilterStruct> = {
                regType: 'StrangerNode',
                props: { name: 'Stranger' },
                actions: {
                    sendEvent: (info) => {
                        c.msgBus.send({
                            channel: 'CUSTOM.EVENT',
                            group: 'in',
                            payload: { info },
                        });
                    },
                },
                view: () => <div>Stranger Node</div>,
            };
            c = useComponent(def, params);
            strangerComp = c;
            return c;
        };
        const Stranger = toReact(useStranger);

        wrap(
            <div>
                <Parent />
                <Stranger />
            </div>,
        );

        // 1. Event sent by Stranger (not in ancestor chain)
        await act(async () => {
            strangerComp.model.sendEvent('From Stranger');
        });
        await new Promise((res) => setTimeout(res, 20));
        expect(receivedMessages).not.toContain('From Stranger');

        // 2. Event sent by Parent (direct ancestor)
        await act(async () => {
            parentComp.model.sendEvent('From Parent');
        });
        await waitFor(() => {
            expect(receivedMessages).toContain('From Parent');
        });
    });
});

