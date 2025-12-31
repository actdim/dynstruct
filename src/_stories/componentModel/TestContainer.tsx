import {
    bind,
    Component,
    ComponentMsgFilter,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusChannels, AppMsgStruct } from './bootstrap'; // appDomain
import { TestChildStruct, useTestChild } from './TestChild';
import { ComponentMsgHeaders } from '@/componentModel/contracts';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            text: string;
        };
        methods: {};
        children: {
            child1: TestChildStruct;
            child2: TestChildStruct;
        };
        msgScope: {
            subscribe: AppBusChannels<'TEST-EVENT'>;
            provide: AppBusChannels<'LOCAL-EVENT'>;
        };
    }
>;

export const useTestContainer = (params: ComponentParams<Struct>) => {
    const component: Component<Struct, ComponentMsgHeaders & { test: string }> = {
        props: {
            text: undefined,
        },
        methods: {},

        events: {},

        msgBroker: {
            subscribe: {
                'TEST-EVENT': {
                    in: {
                        callback: (msg, m) => {
                            m.text = msg.payload;
                        },
                        componentFilter: ComponentMsgFilter.FromDescendants,
                    },
                },
            },
            provide: {
                'LOCAL-EVENT': {
                    in: {
                        callback: (msgIn, headers, m) => {
                            return `Hi ${msgIn.payload} from parent ${m.$.id}!`;
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
                    () => model.text,
                    (v) => {
                        model.text = v;
                    },
                ),
            }),
        },

        view: (_, m) => {
            return (
                <>
                    <div style={{ padding: '10px', margin: '10px' }}>
                        <p>Text: {m.text}</p>
                        <p>
                            <div style={{ padding: '4px' }}>
                                <m.child1.View></m.child1.View>
                            </div>
                            <div style={{ padding: '4px' }}>
                                <m.child2.View></m.child2.View>
                            </div>
                        </p>
                    </div>
                </>
            );
        },
    };

    const model = useComponent(component, params);
    return model;
};

export type TestContainerStruct = Struct;
export const TestContainerFC = getFC(useTestContainer);
