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
import { AppMsgStruct } from './bootstrap';

// import './simpleEdit.css';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
        };
        actions: {};
        // children: {};
        msgScope: {};
    }
>;

export const useSimpleEdit = (params: ComponentParams<Struct>) => {
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
                </>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type SimpleEditStruct = Struct;
export const SimpleEditFC = getFC(useSimpleEdit);
