import { BaseApiBusStruct, BaseAppBusStruct, NavRoutes } from '@/appDomain/appContracts';
import { createNavigationRoute } from '@/appDomain/navigation';
import { ComponentContextProvider, useComponentContext } from '@/componentModel/componentContext';
import { BaseComponentContext, ComponentRegistryContext } from '@/componentModel/contracts';
import { MsgBusStructFactory } from '@actdim/msgmesh/msgBusCore';
import { createMsgBus } from '@actdim/msgmesh/msgBusFactory';
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

export type ApiBusStruct = BaseApiBusStruct;

export type AppBusStruct = BaseAppBusStruct<AppRoutes> &
    MsgBusStructFactory<{
        'TEST-EVENT': {
            in: string;
        };
    }> &
    ApiBusStruct;

export function createAppMsgBus() {
    const msgBus = createMsgBus<AppBusStruct>({});
    return msgBus;
}

export const appMsgBus = createAppMsgBus();

export type AppBusChannels<TChannel extends keyof AppBusStruct | Array<keyof AppBusStruct>> =
    KeysOf<AppBusStruct, TChannel>;

export type AppContext = ComponentRegistryContext<AppBusStruct>;

export const AppContextProvider = (
    props: PropsWithChildren<{
        value?: BaseComponentContext<AppBusStruct>;
    }>,
) => ComponentContextProvider(props);

export const useAppContext = () => useComponentContext() as AppContext;
