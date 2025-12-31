import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppMsgStruct } from './bootstrap';

// import './simpleEdit.css';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
        };
        methods: {};
        // children: {};
        msgScope: {};
    }
>;

export const useSimpleEdit = (params: ComponentParams<Struct>) => {
    const component: Component<Struct> = {
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
                        value={m.value}
                    ></input>
                </>
            );
        },
    };

    const model = useComponent(component, params);
    return model;
};

export type SimpleEditStruct = Struct;
export const SimpleEditFC = getFC(useSimpleEdit);
