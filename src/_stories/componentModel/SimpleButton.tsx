import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusChannels, AppMsgStruct, AppMsgBus } from './bootstrap';

// import './simpleButton.css';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            onClick: () => void;
            content: string;
        };
        methods: {};
        // children: {};
        msgScope: {
        };
    }
>;

export const useSimpleButton = (params: ComponentParams<Struct>) => {
    const component: Component<Struct> = {
        props: {
            onClick: undefined,
            content: undefined,
        },

        methods: {},

        events: {},

        msgBroker: {},

        children: {},

        view: (_, m) => {
            return (
                <>
                    <button onClick={m.onClick}>{m.content}</button>
                </>
            );
        },
    };

    const model = useComponent(component, params);
    return model;
};

export type SimpleButtonStruct = Struct;
export const SimpleButtonFC = getFC(useSimpleButton);
