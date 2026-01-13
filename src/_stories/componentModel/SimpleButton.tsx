import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { getFC, useComponent } from '@/componentModel/react';
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
