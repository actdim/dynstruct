import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { getFC, useComponent } from '@/componentModel/react';
import React from 'react';
import { AppMsgChannels, AppMsgStruct } from './bootstrap';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
        };

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
                            c.msgBus.send({
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
