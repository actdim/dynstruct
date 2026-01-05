import {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppMsgChannels, AppMsgStruct } from './bootstrap';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
            handle: boolean;
        };
        actions: {};
        // children: {};
        msgScope: {
            subscribe: AppMsgChannels<'TEST-EVENT'>;
        };
    }
>;

export const useTestEventConsumer = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            value: 'foo',
            handle: true,
        },

        actions: {},

        events: {
            onReady: async () => {},
        },

        msgBroker: {
            subscribe: {
                'TEST-EVENT': {
                    in: {
                        callback: (msg, c) => {
                            if (m.handle) {
                                m.value = msg.payload;
                            }
                        },
                    },
                },
            },
        },

        children: {},

        view: (_, c) => {
            return (
                <>
                    <input type="text" value={m.value}></input>
                    {m.handle && (
                        <button
                            onClick={() => {
                                m.handle = false;
                            }}
                        >
                            Ignore events
                        </button>
                    )}
                    {!m.handle && (
                        <button
                            onClick={() => {
                                m.handle = true;
                            }}
                        >
                            Handle events
                        </button>
                    )}
                    <button
                        onClick={() => {
                            c.msgBroker?.abortController.abort();
                        }}
                    >
                        Abort subscription
                    </button>
                </>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type TestEventConsumerStruct = Struct;
export const TestEventConsumerFC = getFC(useTestEventConsumer);
