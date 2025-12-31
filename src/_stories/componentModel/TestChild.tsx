import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusChannels, AppMsgStruct, AppMsgBus } from './bootstrap';
import { ComponentMsgHeaders } from '@/componentModel/contracts';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
        };
        methods: {};
        // children: {};
        msgScope: {
            publish: AppBusChannels<'TEST-EVENT'>;
            subscribe: AppBusChannels<'LOCAL-EVENT'>;
        };
    }
>;

export const useTestChild = (params: ComponentParams<Struct>) => {
    const component: Component<Struct, ComponentMsgHeaders & { test?: string }> = {
        props: {
            value: 'foo',
        },

        methods: {},

        events: {
            onReady: async () => {},
        },

        msgBroker: {},

        children: {},

        view: (_, m) => {
            return (
                <>
                    <input
                        type="text"
                        onChange={(e) => {
                            m.value = e.target.value;
                        }}
                        value={model.value}
                    ></input>
                    <button
                        onClick={() => {
                            m.msgBus.dispatch({
                                channel: 'TEST-EVENT',
                                payload: m.value,
                            });
                        }}
                    >
                        Send
                    </button>
                    <button
                        onClick={async () => {
                            const msg = await m.msgBus.dispatchAsync({
                                channel: 'LOCAL-EVENT',
                                payload: m.value,
                            });
                            alert(msg.payload);
                        }}
                    >
                        Request
                    </button>
                </>
            );
        },
    };

    const model = useComponent(component, params);
    return model;
};

export type TestChildStruct = Struct;
export const TestChildFC = getFC(useTestChild);
