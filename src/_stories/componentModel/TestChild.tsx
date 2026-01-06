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
import { ComponentMsgHeaders } from '@/componentModel/contracts';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
        };
        actions: {};
        // children: {};
        msgScope: {
            publish: AppMsgChannels<'TEST-EVENT' | 'LOCAL-EVENT'>;
        };
    }
>;

export const useTestChild = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const componentDef: ComponentDef<Struct, ComponentMsgHeaders & { test?: string }> = {
        props: {
            value: 'foo',
        },

        events: {
            onReady: async () => {},
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
                            c.msgBus.dispatch({
                                channel: 'TEST-EVENT',
                                payload: m.value,
                            });
                        }}
                    >
                        Send
                    </button>
                    <button
                        onClick={async () => {
                            const msg = await c.msgBus.dispatchAsync({
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

    c = useComponent(componentDef, params);
    m = c.model;
    return c;
};

export type TestChildStruct = Struct;
export const TestChildFC = getFC(useTestChild);
