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
            ignoreEvents: boolean;
        };
        msgScope: {
            subscribe: AppMsgChannels<'TEST-EVENT'>;
        };
    }
>;

export const useTestEventConsumer = (params?: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            value: '',
            ignoreEvents: false,
        },

        msgBroker: {
            subscribe: {
                'TEST-EVENT': {
                    in: {
                        callback: (msg, c) => {
                            if (!m.ignoreEvents) {
                                m.value = msg.payload;
                            }
                        },
                    },
                },
            },
        },

        view: () => (
            <details open style={detailsStyle}>
                <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Consumer</summary>
                <div style={row}>
                    <span style={labelStyle}>Received</span>
                    <input type="text" value={m.value} readOnly />
                </div>
                <div style={row}>
                    <input
                        type="checkbox"
                        checked={m.ignoreEvents}
                        onChange={() => (m.ignoreEvents = !m.ignoreEvents)}
                    />
                    <span style={{ fontSize: 12 }}>Ignore messages</span>
                </div>
            </details>
        ),
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type TestEventConsumerStruct = Struct;
export const TestEventConsumer = toReact(useTestEventConsumer);
