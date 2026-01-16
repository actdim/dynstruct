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

// import './simpleEdit.css';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
        };
    }
>;

export const useSimpleEdit = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            value: "foo",
        },
        view: (_, c) => {
            return (
                <div id={c.id}>
                    <input
                        type="text"
                        onChange={(e) => {
                            m.value = e.target.value;
                        }}
                        value={m.value}
                    ></input>
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type SimpleEditStruct = Struct;
export const SimpleEdit = getFC(useSimpleEdit);
