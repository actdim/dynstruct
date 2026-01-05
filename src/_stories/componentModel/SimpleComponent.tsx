import {
    bind,
    bindProp,
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppMsgChannels, AppMsgStruct } from './bootstrap';
import { SimpleButtonStruct, useSimpleButton } from './SimpleButton';
import { SimpleEditStruct, useSimpleEdit } from './SimpleEdit';
import { DynamicContentStruct, useDynamicContent } from '../../componentModel/DynamicContent';

// import './simpleComponent.css';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            counter: number;
            text: string;
        };
        actions: {};
        children: {
            button: SimpleButtonStruct;
            edit: SimpleEditStruct;
            content: DynamicContentStruct<string, AppMsgStruct>;
            dynEdit: (props: { value?: string }) => SimpleEditStruct;
        };

        msgScope: {
            provide: AppMsgChannels<'APP-CONFIG-GET'>;
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

        actions: {},

        events: {},

        msgBroker: {},

        children: {
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
                render: () => {
                    // return <>{props.text}</>;
                    return <>{c.children.content.model.data}</>;
                },
            }),
            dynEdit: (params) => {
                let editorModel = useSimpleEdit({
                    value: bindProp(() => m, 'text'),
                    // value: params.value,
                });
                return editorModel;
            },
        },

        view: (_, c) => {
            return (
                <div id={c.id}>
                    <div>Counter: {m.counter}</div>
                    <div>
                        Button: <c.children.button.View></c.children.button.View>
                    </div>
                    <div>
                        Edit: <c.children.edit.View></c.children.edit.View>
                    </div>
                    <div>
                        Content: <c.children.content.View></c.children.content.View>
                    </div>
                    <ul>
                        {Array.from({ length: m.counter }).map((_, i) => (
                            <li>
                                {/* value={m.text} */}
                                <c.children.DynEdit key={i}></c.children.DynEdit>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type SimpleComponentStruct = Struct;
export const SimpleComponentFC = getFC(useSimpleComponent);
