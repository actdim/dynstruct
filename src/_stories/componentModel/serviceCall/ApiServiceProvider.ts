import React from 'react';
import { TestApiClient } from './TestApiClient';
import { KeysOf } from '@actdim/utico/typeCore';

import { ServiceProvider } from '@/services/react/ServiceProvider';
import {
    BaseServiceSuffix,
    getMsgChannelSelector,
    MsgProviderAdapter,
    ToMsgChannelPrefix,
    ToMsgStruct,
} from '@actdim/msgmesh/adapters';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

type ServiceSuffix = BaseServiceSuffix;
type BaseApiPrefix = 'API';
type TestApiChannelPrefix = ToMsgChannelPrefix<
    typeof TestApiClient.name,
    BaseApiPrefix,
    ServiceSuffix
>;

type ApiMsgStruct = ToMsgStruct<
    TestApiClient,
    TestApiChannelPrefix,
    'extraMethod'
    // 'extraMethod' | keyof ClientBase
>;

export const services: Record<TestApiChannelPrefix, any> = {
    'API.TEST.': new TestApiClient(),
};

export const msgProviderAdapters = Object.entries(services).map(
    (entry) =>
        ({
            service: entry[1],
            channelSelector: getMsgChannelSelector(services),
        }) as MsgProviderAdapter,
);

export type CustomMsgStruct = BaseAppMsgStruct & ApiMsgStruct;

export type CustomMsgChannels<
    TChannel extends keyof CustomMsgStruct | Array<keyof CustomMsgStruct>,
> = KeysOf<CustomMsgStruct, TChannel>;

export const ApiServiceProvider = () => ServiceProvider({ adapters: msgProviderAdapters });
// global provider
// export const ApiServiceProvider =  createServiceProvider(appMsgBus, msgProviderAdapters);
