import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusStruct, appMsgBus } from './bootstrap';

// import './simpleButton.css';

type Struct = ComponentStruct<
    AppBusStruct,
    {
        props: {
            onClick: () => void;
            content: string;
        };
        methods: {};
        // children: {};
        msgScope: {};
    }
>;

export const useSimpleButton = (params: ComponentParams<Struct>) => {
    // const context = useAppContext();
    const component: Component<Struct> = {
        props: {
            onClick: undefined,
            content: undefined,
        },

        methods: {},

        events: {
            onReady: async () => {},
        },

        msgBroker: {},

        children: {},

        view: () => {            
            return (
                <>
                    <button onClick={model.onClick}>{model.content}</button>
                </>
            );
        },

        msgBus: appMsgBus,
    };

    const model = useComponent(component, params);
    return model;
};

export type SimpleButtonStruct = Struct;
export const SimpleButtonFC = getFC(useSimpleButton);
