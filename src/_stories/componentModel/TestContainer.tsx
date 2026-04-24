import {
    ComponentMsgFilter,
    ComponentMsgHeaders,
    type Component,
    type ComponentDef,
    type ComponentModel,
    type ComponentParams,
    type ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { AppMsgChannels, AppMsgStruct } from './bootstrap'; // appDomain
import { TestChildStruct, useTestChild } from './TestChild';
import { bind } from '@/componentModel/core';
import { detailsStyle, labelStyle, row } from './styles';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            text: string;
        };
        children: {
            child1: TestChildStruct;
            child2: TestChildStruct;
        };
        msgScope: {
            subscribe: AppMsgChannels<'TEST-EVENT'>;
            provide: AppMsgChannels<'LOCAL-EVENT'>;
        };
    }
>;

export const useTestContainer = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            text: undefined,
        },

        events: {
            onChangeText: () => {
                c.children.child2.model.value = m.text;
            },
        },

        msgBroker: {
            subscribe: {
                'TEST-EVENT': {
                    in: {
                        callback: (msg, c) => {
                            m.text = msg.payload;
                        },
                        componentFilter: ComponentMsgFilter.FromDescendants,
                    },
                },
            },
            provide: {
                'LOCAL-EVENT': {
                    in: {
                        callback: (msgIn, headers, c) => {
                            return `Hi ${msgIn.payload} from parent ${c.id}!`;
                        },
                        componentFilter: ComponentMsgFilter.FromDescendants,
                    },
                },
            },
        },

        children: {
            child1: useTestChild({}),
            child2: useTestChild({
                // direct binding
                // value: bind(
                //     () => m.text,
                //     (v) => {
                //         m.text = v;
                //     },
                // ),
            }),
        },

        view: () => {
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Container</summary>
                    <div style={row}>
                        <span style={labelStyle}>Received</span>
                        <input type="text" value={m.text ?? ''} readOnly />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        <c.children.child1.View />
                        <c.children.child2.View />
                    </div>
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type TestContainerStruct = Struct;
export const TestContainer = toReact(useTestContainer);
