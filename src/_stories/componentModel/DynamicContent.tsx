import {
    Component,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppBusStruct } from './bootstrap';

export type DynamicContentStruct<TData = any> = ComponentStruct<
    AppBusStruct,
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
        view: () => {
            return model.render();
        },
    };

    const model = useComponent(component, params);
    return model;
}
