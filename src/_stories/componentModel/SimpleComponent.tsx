import {
    bind,
    bindProp,
    Component,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusChannels, AppMsgStruct } from './bootstrap';
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
        methods: {};
        children: {
            button: SimpleButtonStruct;
            edit: SimpleEditStruct;
            content: DynamicContentStruct<string, AppMsgStruct>;
            dynEdit: (props: { value?: string }) => SimpleEditStruct;
        };

        msgScope: {
            provide: AppBusChannels<'APP-CONFIG-GET'>;
        };
    }
>;

export const useSimpleComponent = (params: ComponentParams<Struct>) => {
    let model: ComponentModel<Struct>;
    let component: Component<Struct> = {
        props: {
            counter: 0,
            text: 'bar',
        },

        methods: {},

        events: {},

        msgBroker: {},

        children: {
            button: useSimpleButton({
                content: 'Add input',
                onClick: () => {
                    model.counter++;
                },
            }),
            edit: useSimpleEdit({
                value: bind(
                    () => model.text,
                    (v) => {
                        model.text = v;
                    },
                ),
            }),
            content: useDynamicContent<string>({
                data: bindProp(() => model, 'text'),
                render: () => {
                    // return <>{model.text}</>;
                    return <>{model.content.data}</>;
                },
            }),
            dynEdit: (params) => {
                let editorModel = useSimpleEdit({
                    value: bindProp(() => model, 'text'),
                    // value: params.value,
                    onInit: (m) => {},
                });
                return editorModel;
            },
        },

        view: (_, m) => {
            return (
                <div id={m.$.id}>
                    <div>Counter: {m.counter}</div>
                    <div>
                        Button: <m.button.View></m.button.View>
                    </div>
                    <div>
                        Edit: <m.edit.View></m.edit.View>
                    </div>
                    <div>
                        Content: <m.content.View></m.content.View>
                    </div>
                    <ul>
                        {Array.from({ length: model.counter }).map((_, i) => (
                            <li>
                                {/* value={m.text} */}
                                <m.DynEdit key={i}></m.DynEdit>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        },
    };

    model = useComponent(component, params);
    return model;
};

export type SimpleComponentStruct = Struct;
export const SimpleComponentFC = getFC(useSimpleComponent);
