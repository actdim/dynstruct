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

// import './simpleButton.css';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            onClick: () => void;
            content: string;
        };
        actions: {};
        // children: {};
        msgScope: {};
    }
>;

export const useSimpleButton = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            onClick: undefined,
            content: undefined,
        },

        actions: {},

        events: {},

        msgBroker: {},

        children: {},

        view: (_, c) => {
            return (
                <>
                    <button onClick={m.onClick}>{m.content}</button>
                </>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type SimpleButtonStruct = Struct;
export const SimpleButtonFC = getFC(useSimpleButton);
