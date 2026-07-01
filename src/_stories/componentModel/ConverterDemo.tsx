import type {
    Component,
    ComponentDef,
    ComponentStructExt,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import React from 'react';
import { AppMsgStruct } from './bootstrap';
import { SimpleEditStruct, useSimpleEdit } from './SimpleEdit';
import { bind } from '@/componentModel/core';
import { detailsStyle, labelStyle, row } from './styles';

type Struct = ComponentStruct<AppMsgStruct, {}>;

export const useConverterDemo = (params: ComponentParams<Struct>): Component<Struct> => {
    type ImplStruct = ComponentStructExt<
        Struct,
        {
            props: {
                timestamp: number;
            };
            children: {
                dtEdit: SimpleEditStruct;
            };
        }
    >;

    let c: Component<ImplStruct>;
    let m: ComponentModel<ImplStruct>;

    const def: ComponentDef<ImplStruct> = {
        props: {
            timestamp: Date.now(),
        },
        children: {
            dtEdit: useSimpleEdit({
                value: bind(
                    () => new Date(m.timestamp).toISOString(),
                    (v) => {
                        const ts = +new Date(v);
                        if (!isNaN(ts)) {
                            m.timestamp = ts;
                        }
                    },
                ),
            }),
        },
        view: () => (
            <details open style={detailsStyle}>
                <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Converter</summary>
                <div style={row}>
                    <span style={labelStyle}>Timestamp Number</span>
                    {m.timestamp}
                    {/* <c.children.LastNameEdit /> */}
                </div>
                <div style={row}>
                    <span style={labelStyle}>Timestamp String</span>
                    <c.children.DtEdit />
                </div>
            </details>
        ),
    };

    c = useComponent(def, params);

    m = c.model;

    return c;
};

export type ConverterDemoStruct = Struct;
export const ConverterDemo = toReact(useConverterDemo);
