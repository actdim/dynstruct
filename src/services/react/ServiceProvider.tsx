import { useComponentContext } from '@/componentModel/componentContext';
import { createContext, PropsWithChildren, useLayoutEffect } from 'react';
import { MsgProviderAdapter, registerAdapters } from '../../componentModel/adapters';
import React from 'react';

const ReactContext = createContext<{
    adapters: MsgProviderAdapter[];
    abortSignal?: AbortSignal;
}>(undefined);

export function ServiceProvider(
    props: PropsWithChildren<{
        adapters?: MsgProviderAdapter[];
        abortSignal?: AbortSignal;
    }>,
) {
    const context = useComponentContext();
    const abortController = new AbortController();
    let abortSignal = props.abortSignal;
    if (abortSignal) {
        abortSignal = AbortSignal.any([abortSignal, abortController.signal]);
    }
    useLayoutEffect(() => {
        registerAdapters(context.msgBus, props.adapters, abortSignal);
        return () => {
            abortController.abort();
        };
    }, [context.msgBus, props.adapters]);

    return (
        <ReactContext.Provider
            value={{
                adapters: props.adapters,
                abortSignal: abortSignal,
            }}
        >
            {props.children}
        </ReactContext.Provider>
    );
}
