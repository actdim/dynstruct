import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { NavRoutes } from '@/appDomain/commonContracts';
import { createNavigationRoute } from '@/appDomain/navigation';
import {
    ComponentContextProvider,
    useComponentContext,
} from '@/componentModel/react/componentContext';
import type {
    BaseContext,
    ComponentMsgHeaders,
    ComponentRegistryContext,
} from '@/componentModel/contracts';
import { $C_INHERIT, MsgBus, MsgStruct } from '@actdim/msgmesh/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { KeysOf } from '@actdim/utico/typeCore';
import React, { PropsWithChildren } from 'react';

export const appRoutes = {
    page: createNavigationRoute<{
        tag: string;
    }>({
        pattern: 'page',
        element: undefined,
    }),
    example: createNavigationRoute<{
        param: string;
    }>({
        pattern: 'example',
        element: undefined,
    }),
} satisfies NavRoutes;

export type AppRoutes = typeof appRoutes;

export type AppMsgStruct = BaseAppMsgStruct<AppRoutes> &
    MsgStruct<{
        'TEST-EVENT': {
            in: string;
        };
        'LOCAL-EVENT': {
            in: string;
            out: string;
        };
    }>;

export type AppMsgHeaders = ComponentMsgHeaders;

export type AppMsgBus = MsgBus<AppMsgStruct, AppMsgHeaders>;

export function createAppMsgBus() {
    const msgBus = createMsgBus<AppMsgStruct, AppMsgHeaders>({
        [$C_INHERIT]: {
            mandatoryProvider: true,
        },
    });
    msgBus.on({
        channel: 'MSGBUS.ERROR',
        topic: 'msgbus',
        callback: (msg) => {
            console.error(msg.payload);
        },
    });
    msgBus.on({
        channel: 'APP.ERROR',
        topic: 'msgbus',
        callback: (msg) => {
            console.error(msg.payload);
        },
    });
    msgBus.on({
        channel: 'APP.SECURITY.AUTH.SESSION.GET',
        group: 'error',
        callback: (msg) => {
            console.error(msg.payload);
        },
    });
    return msgBus;
}

export const appMsgBus = createAppMsgBus();

export type AppMsgChannels<TChannel extends keyof AppMsgStruct | Array<keyof AppMsgStruct>> =
    KeysOf<AppMsgStruct, TChannel>;

export type AppContext = ComponentRegistryContext<AppMsgStruct>;

export const AppContextProvider = (
    props: PropsWithChildren<{
        value?: BaseContext<AppMsgStruct>;
    }>,
) => ComponentContextProvider(props);

export const useAppContext = () => useComponentContext() as AppContext;
