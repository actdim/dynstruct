import {
    ComponentDef,
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
        actions: {};
        children: {};
        msgScope: {};
    }
>;

export function useDynamicContent<TData = any>(
    params: ComponentParams<DynamicContentStruct<TData>>,
) {
    const componentDef: ComponentDef<DynamicContentStruct<TData>> = {
        props: {
            render: undefined,
            data: undefined,
        },
        view: (_, c) => {
            return c.model.render();
        },
    };

    const component = useComponent(componentDef, params);
    return component;
}
