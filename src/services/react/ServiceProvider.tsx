import { useComponentContext } from '@/componentModel/react/componentContext';
import { MsgProviderAdapter, registerAdapters } from '@actdim/msgmesh/adapters';
import { PropsWithChildren, useEffect } from 'react';
import React from 'react';

export function ServiceProvider(
    props: PropsWithChildren<{
        adapters?: MsgProviderAdapter[];
        abortSignal?: AbortSignal;
    }>,
) {
    const context = useComponentContext();

    useEffect(() => {
        const abortController = new AbortController();
        const abortSignal = props.abortSignal
            ? AbortSignal.any([abortController.signal, props.abortSignal])
            : abortController.signal;

        registerAdapters(context.msgBus, props.adapters, abortSignal);
        return () => {
            abortController.abort();
        };
    }, [context.msgBus, props.adapters]);

    return <>{props.children}</>;
}
