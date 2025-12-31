import {
    Component,
    ComponentParams,
    ComponentStruct,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { MsgStruct } from '@actdim/msgmesh/msgBusCore';

export type DynamicContentStruct<
    TData = any,
    TMsgStruct extends MsgStruct = MsgStruct,
> = ComponentStruct<
    TMsgStruct,
    {
        props: {
            data: TData;
            render: () => React.ReactNode;
        };
        methods: {};
        children: {};
        msgScope: {};
    }
>;

export function useDynamicContent<TData = any>(
    params: ComponentParams<DynamicContentStruct<TData>>,
) {
    const component: Component<DynamicContentStruct<TData>> = {
        props: {
            render: undefined,
            data: undefined,
        },
        view: (_, m) => {
            return m.render();
        },
    };

    const model = useComponent(component, params);
    return model;
}
