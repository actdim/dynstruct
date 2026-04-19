import React from 'react';
import { KeysOf } from '@actdim/utico/typeCore';

import { ServiceProvider } from '@/services/react/ServiceProvider';
import {
    BaseServiceSuffix,
    getMsgChannelSelector,
    MsgProviderAdapter,
    ToMsgChannelPrefix,
    ToMsgStruct,
} from '@actdim/msgmesh/adapters';
import { SecureApiClient } from './SecureApiClient';
import { appMsgBus } from '../bootstrap';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

type ServiceSuffix = BaseServiceSuffix;
type BaseApiPrefix = 'API';
type SecureApiChannelPrefix = ToMsgChannelPrefix<
    typeof SecureApiClient.name,
    BaseApiPrefix,
    ServiceSuffix
>;

type SecureApiMsgStruct = ToMsgStruct<
    SecureApiClient,
    SecureApiChannelPrefix
>;

export const services: Record<SecureApiChannelPrefix, any> = {
    'API.SECURE.': new SecureApiClient({
        msgBus: appMsgBus
    }),
};

export const msgProviderAdapters = Object.entries(services).map(
    (entry) =>
        ({
            service: entry[1],
            channelSelector: getMsgChannelSelector(services),
        }) as MsgProviderAdapter,
);

export type SecurityDemoMsgStruct = BaseAppMsgStruct & SecureApiMsgStruct;

export type SecurityDemoMsgChannels<
    TChannel extends keyof SecurityDemoMsgStruct | Array<keyof SecurityDemoMsgStruct>,
> = KeysOf<SecurityDemoMsgStruct, TChannel>;

export const SecurityDemoServiceProvider = () => ServiceProvider({ adapters: msgProviderAdapters });
// global provider
// export const SecurityDemoServiceProvider =  createServiceProvider(appMsgBus, msgProviderAdapters);
