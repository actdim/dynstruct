import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import type { BaseAppMsgStruct } from '@/appDomain/appContracts';
import React from 'react';
import { useComponent } from './react';

export type DynamicContentStruct<
    TData = never,
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
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
    const def: ComponentDef<DynamicContentStruct<TData>> = {
        props: {
            render: undefined,
            data: undefined,
        },
        view: () => {
            return m.render();
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
}
