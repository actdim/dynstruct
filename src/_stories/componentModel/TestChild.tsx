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
import { ComponentMsgHeaders } from '@/componentModel/contracts';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
        };
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
                    <button
                        onClick={async () => {
                            const msg = await c.msgBus.request({
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
