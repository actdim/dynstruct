import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusChannels, AppMsgStruct } from './bootstrap';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
            handle: boolean;
        };
        methods: {};
        // children: {};
        msgScope: {
            subscribe: AppBusChannels<'TEST-EVENT'>;
        };
    }
>;

export const useTestEventConsumer = (params: ComponentParams<Struct>) => {
    const component: Component<Struct> = {
        props: {
            value: 'foo',
            handle: true,
        },

        methods: {},

        events: {
            onReady: async () => {},
        },

        msgBroker: {
            subscribe: {
                'TEST-EVENT': {
                    in: {
                        callback: (msg, m) => {
                            if (m.handle) {
                                m.value = msg.payload;
                            }
                        },
                    },
                },
            },
        },

        children: {},

        view: (_, m) => {
            return (
                <>
                    <input type="text" value={model.value}></input>
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
                            m.msgBroker.abortController.abort();
                        }}
                    >
                        Abort subscription
                    </button>
                </>
            );
        },
    };

    const model = useComponent(component, params);

    return model;
};

export type TestEventConsumerStruct = Struct;
export const TestEventConsumerFC = getFC(useTestEventConsumer);
