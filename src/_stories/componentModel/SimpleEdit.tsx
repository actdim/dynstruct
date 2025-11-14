import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusStruct, appMsgBus } from './bootstrap';

// import './simpleEdit.css';

type Struct = ComponentStruct<
    AppBusStruct,
    {
        props: {
            value: string;
        };
        methods: {};
        // children: {};
        msgScope: {};
    }
>;

export const useSimpleEdit = (params: ComponentParams<Struct>) => {
    // const context = useAppContext();

    const component: Component<Struct> = {
        props: {
            value: 'foo',
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
                    <input
                        type="text"
                        onChange={(e) => {
                            model.value = e.target.value;
                        }}
                        value={model.value}
                    ></input>
                </>
            );
        },

        msgBus: appMsgBus,
    };

    const model = useComponent(component, params);
    return model;
};

export type SimpleEditStruct = Struct;
export const SimpleEditFC = getFC(useSimpleEdit);
