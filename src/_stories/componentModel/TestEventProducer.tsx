import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusChannels, AppBusStruct, appMsgBus } from './bootstrap';

type Struct = ComponentStruct<
    AppBusStruct,
    {
        props: {
            value: string;
        };
        methods: {};
        // children: {};
        msgScope: {
            publish: AppBusChannels<'TEST-EVENT'>;
        };
    }
>;

export const useTestEventProducer = (params: ComponentParams<Struct>) => {
    const component: Component<Struct> = {
        props: {
            value: 'foo',
        },

        methods: {},

        events: {
            onReady: async () => {},
        },

        msgBroker: {},

        children: {},

        view: () => {
            
            return (
                <>
                    <input
                        type="text"
                        onChange={(e) => {
                            model.value = e.target.value;
                            model.msgBus.dispatch({
                                channel: 'TEST-EVENT',
                                payload: e.target.value,
                            });
                        }}
                        value={model.value}
                    ></input>
                </>
            );
        },
        msgBus: appMsgBus
        
    };

    const model = useComponent(component, params);
    return model;
};

export type TestEventProducerStruct = Struct;
export const TestEventProducerFC = getFC(useTestEventProducer);
