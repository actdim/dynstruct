import {
    Component,
    ComponentDef,
    ComponentModel,
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
    }
>;

export function useDynamicContent<TData = any>(
    params: ComponentParams<DynamicContentStruct<TData>>,
) {
    let c: Component<DynamicContentStruct<TData>>;
    let m: ComponentModel<DynamicContentStruct<TData>>;
    const componentDef: ComponentDef<DynamicContentStruct<TData>> = {
        props: {
            render: undefined,
            data: undefined,
        },
        view: (_, c) => {
            return m.render();
        },
    };

    c = useComponent(componentDef, params);
    m = c.model;
    return c;
}
