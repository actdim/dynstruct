import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusChannels, AppBusStruct, useAppContext } from './bootstrap';

type Struct = ComponentStruct<
    AppBusStruct,
    {
        props: {
            value: string;
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
        },

        methods: {},

        events: {
            onReady: async () => {},
        },

        msgBroker: {
            subscribe: {
                'TEST-EVENT': {
                    in: {
                        callback: (msg) => {
                            model.value = msg.payload;
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
                    <button onClick={() => {
                        m.msgBroker.abortController.abort();
                    }}>Stop listening</button>
                </>
            );
        },
    };

    const model = useComponent(component, params);

    return model;
};

export type TestEventConsumerStruct = Struct;
export const TestEventConsumerFC = getFC(useTestEventConsumer);
