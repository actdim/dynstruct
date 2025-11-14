import { BaseApiBusStruct, BaseAppBusStruct, NavRoutes } from '@/appDomain/appContracts';
import { createNavigationRoute } from '@/appDomain/navigation';
import { createMsgBus } from '@actdim/msgmesh/msgBusFactory';
import React from 'react';

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

export type AppBusStruct = BaseAppBusStruct<AppRoutes> & ApiBusStruct;

export function createAppMsgBus() {
    const msgBus = createMsgBus<AppBusStruct>({});
    return msgBus;
}

export const appMsgBus = createAppMsgBus();
