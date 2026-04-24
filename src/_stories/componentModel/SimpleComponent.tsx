import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React, { ReactNode } from 'react';
import { AppMsgStruct } from './bootstrap';
import { SimpleButtonStruct, useSimpleButton } from './SimpleButton';
import { SimpleEditStruct, useSimpleEdit } from './SimpleEdit';
import { DynamicContentStruct, useDynamicContent } from '../../componentModel/DynamicContent';
import { bind, bindProp } from '@/componentModel/core';
import { detailsStyle, labelStyle, row } from './styles';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            counter: number;
            text: string;
        };
        children: {
            summary: React.FC;
            button: SimpleButtonStruct;
            edit: SimpleEditStruct;
            content: DynamicContentStruct<string>;
            dynEdit: (props: { value?: string }) => SimpleEditStruct;
        };
    }
>;

export const useSimpleComponent = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            counter: 0,
            text: 'bar',
        },
        children: {
            summary: () => {
                return <div>Counter: {m.counter}</div>;
            },
            button: useSimpleButton({
                content: 'Add input',
                onClick: () => {
                    m.counter++;
                },
            }),
            edit: useSimpleEdit({
                value: bind(
                    () => m.text,
                    (v) => {
                        m.text = v;
                    },
                ),
            }),
            content: useDynamicContent<string>({
                data: bindProp(() => m, 'text'),
                render: (_, dc) => {
                    // return <>{c.children.content.model.data}</>;
                    return <>{dc.model.data}</>;
                },
            }),
            dynEdit: (params) => {
                let dynComponent = useSimpleEdit({
                    // value: bindProp(() => m, 'text'),
                    // value: 'test',
                    value: params.value,
                });
                return dynComponent;
            },
        },

        view: () => {
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                        Simple Component
                    </summary>
                    <div style={row}>
                        <span style={labelStyle}>Counter</span>
                        <c.children.Summary />
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>Button</span>
                        <c.children.Button />
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>Edit</span>
                        <c.children.Edit />
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>Content</span>
                        <c.children.Content />
                    </div>
                    <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                        {Array.from({ length: m.counter }).map((_, i) => (
                            <li key={i}>
                                <c.children.DynEdit key={i} value={m.text}></c.children.DynEdit>
                            </li>
                        ))}
                    </ul>
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type SimpleComponentStruct = Struct;
export const SimpleComponent = toReact(useSimpleComponent);
