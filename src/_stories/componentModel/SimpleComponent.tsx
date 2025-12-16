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
import { AppBusChannels, AppBusStruct } from './bootstrap';
import { SimpleButtonStruct, useSimpleButton } from './SimpleButton';
import { SimpleEditStruct, useSimpleEdit } from './SimpleEdit';
import { DynamicContentStruct, useDynamicContent } from './DynamicContent';

// import './simpleComponent.css';

type Struct = ComponentStruct<
    AppBusStruct,
    {
        props: {
            counter: number;
            text: string;
        };
        methods: {};
        children: {
            button: SimpleButtonStruct;
            edit: SimpleEditStruct;
            content: DynamicContentStruct<string>;
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

        msgBroker: {
            
        },

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
                        Button: <model.button.View></model.button.View>
                    </div>
                    <div>
                        Edit: <model.edit.View></model.edit.View>
                    </div>
                    <div>
                        Content: <model.content.View></model.content.View>
                    </div>
                    <ul>
                        {Array.from({ length: model.counter }).map((_, i) => (
                            <li>
                                {/* value={model.text} */}
                                <model.DynEdit key={i}></model.DynEdit>
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
