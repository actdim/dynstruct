import { useComponentContext } from '@/componentModel/componentContext';
import { createContext, PropsWithChildren, useLayoutEffect } from 'react';
import { MsgProviderAdapter, registerAdapters } from '../componentModel/adapters';
import React from 'react';

const ReactContext = createContext<MsgProviderAdapter[]>(undefined);

export function ServiceProvider(
    props: PropsWithChildren<{
        adapters?: MsgProviderAdapter[];
    }>,
) {
    const context = useComponentContext();
    useLayoutEffect(() => {
        const abortController = new AbortController();
        registerAdapters(context.msgBus, props.adapters, abortController.signal);
        return () => {
            abortController.abort();
        };
    }, [context.msgBus, props.adapters]);

    return <ReactContext.Provider value={props.adapters}>{props.children}</ReactContext.Provider>;
}
