import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { AppMsgChannels, AppMsgStruct } from '../bootstrap';
import { detailsStyle, labelStyle, row } from '../styles';

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

export const useTestEventProducer = (params?: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            value: 'foo',
        },
        view: () => (
            <details open style={detailsStyle}>
                <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Producer</summary>
                <div style={row}>
                    <span style={labelStyle}>Message</span>
                    <input
                        type="text"
                        value={m.value}
                        onChange={(e) => (m.value = e.target.value)}
                    />
                </div>
                <div style={{ ...row, marginTop: 10 }}>
                    <button
                        onClick={() => c.msgBus.send({ channel: 'TEST-EVENT', payload: m.value })}
                    >
                        Send
                    </button>
                </div>
            </details>
        ),
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type TestEventProducerStruct = Struct;
export const TestEventProducer = toReact(useTestEventProducer);
