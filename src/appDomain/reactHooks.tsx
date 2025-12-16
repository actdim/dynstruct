import { useComponentContext } from '@/componentModel/componentContext';
import { createContext, PropsWithChildren } from 'react';
import { MsgBusAdapterConfig, registerAdapters } from './adapters';
import React from 'react';

const ReactContext = createContext<MsgBusAdapterConfig>(undefined);

export function MsgBusAdapterProvider(
    props: PropsWithChildren<{
        value?: MsgBusAdapterConfig;
    }>,
) {
    const context = useComponentContext();
    registerAdapters(context.msgBus, props.value);
    return <ReactContext.Provider value={props.value}>{props.children}</ReactContext.Provider>;
}
