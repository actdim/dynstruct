import {
    bind,
    Component,
    ComponentDef,
    ComponentModel,
    ComponentMsgFilter,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppMsgChannels, AppMsgStruct } from './bootstrap'; // appDomain
import { TestChildStruct, useTestChild } from './TestChild';
import { ComponentMsgHeaders } from '@/componentModel/contracts';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            text: string;
        };
        actions: {};
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

    const componentDef: ComponentDef<Struct, ComponentMsgHeaders & { test: string }> = {
        props: {
            text: undefined,
        },
        actions: {},

        events: {},

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
                value: bind(
                    () => m.text,
                    (v) => {
                        m.text = v;
                    },
                ),
            }),
        },

        view: (_, c) => {
            return (
                <>
                    <div>
                        <p>Text: {m.text}</p>
                        <p>
                            <div style={{ padding: '4px' }}>
                                <c.children.child1.View></c.children.child1.View>
                            </div>
                            <div style={{ padding: '4px' }}>
                                <c.children.child2.View></c.children.child2.View>
                            </div>
                        </p>
                    </div>
                </>
            );
        },
    };

    c = useComponent(componentDef, params);
    m = c.model;
    return c;
};

export type TestContainerStruct = Struct;
export const TestContainerFC = getFC(useTestContainer);
