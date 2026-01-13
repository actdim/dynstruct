import { BaseApiMsgStruct, BaseAppMsgStruct, NavRoutes } from '@/appDomain/appContracts';
import { createNavigationRoute } from '@/appDomain/navigation';
import { ComponentContextProvider, useComponentContext } from '@/componentModel/componentContext';
import type {
    BaseComponentContext,
    ComponentMsgHeaders,
    ComponentRegistryContext,
} from '@/componentModel/contracts';
import { MsgBus, MsgStructFactory } from '@actdim/msgmesh/contracts';
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

export type ApiMsgStruct = BaseApiMsgStruct;

export type AppMsgStruct = BaseAppMsgStruct<AppRoutes> &
    MsgStructFactory<{
        'TEST-EVENT': {
            in: string;
        };
        'LOCAL-EVENT': {
            in: string;
            out: string;
        };
    }> &
    ApiMsgStruct;

export type AppMsgHeaders = ComponentMsgHeaders;

export type AppMsgBus = MsgBus<AppMsgStruct, AppMsgHeaders>;

export function createAppMsgBus() {
    const msgBus = createMsgBus<AppMsgStruct, AppMsgHeaders>({});
    return msgBus;
}

export const appMsgBus = createAppMsgBus();

export type AppMsgChannels<TChannel extends keyof AppMsgStruct | Array<keyof AppMsgStruct>> =
    KeysOf<AppMsgStruct, TChannel>;

export type AppContext = ComponentRegistryContext<AppMsgStruct>;

export const AppContextProvider = (
    props: PropsWithChildren<{
        value?: BaseComponentContext<AppMsgStruct>;
    }>,
) => ComponentContextProvider(props);

export const useAppContext = () => useComponentContext() as AppContext;
