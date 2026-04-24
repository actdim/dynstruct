import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    ComponentViewProps,
} from '@/componentModel/contracts';
import type { BaseAppMsgStruct } from '@/appDomain/appContracts';
import React from 'react';
import { useComponent } from './react/react';

export type DynamicContentStruct<
    TData = any,
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
> = ComponentStruct<
    TMsgStruct,
    {
        props: {
            data: TData;
            render: (
                props: ComponentViewProps,
                component: Component<DynamicContentStruct<TData>>,
            ) => React.ReactNode;
        };
    }
>;

export function useDynamicContent<TData = any>(
    params: ComponentParams<DynamicContentStruct<TData>>,
) {
    let c: Component<DynamicContentStruct<TData>>;
    let m: ComponentModel<DynamicContentStruct<TData>>;
    const def: ComponentDef<DynamicContentStruct<TData>> = {
        props: {
            render: undefined,
            data: undefined,
        },
        view: (props, component?) => {
            return m.render(props, component);
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
}
