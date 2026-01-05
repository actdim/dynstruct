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
        };
        actions: {};
        // children: {};
        msgScope: {
            publish: AppMsgChannels<'TEST-EVENT'>;
        };
    }
>;

export const useTestEventProducer = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            value: 'foo',
        },

        actions: {},

        events: {
            onReady: async () => {},
        },

        msgBroker: {},

        children: {},

        view: (_, c) => {
            return (
                <>
                    <input
                        type="text"
                        onChange={(e) => {
                            m.value = e.target.value;
                        }}
                        value={m.value}
                    ></input>
                    <button
                        onClick={() => {
                            c.msgBus.dispatch({
                                channel: 'TEST-EVENT',
                                payload: m.value,
                            });
                        }}
                    >
                        Send
                    </button>
                </>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type TestEventProducerStruct = Struct;
export const TestEventProducerFC = getFC(useTestEventProducer);
