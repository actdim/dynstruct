import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { DataItem, TestApiClient } from '../TestApiClient';
import { KeysOf } from '@actdim/utico/typeCore';

import { ServiceProvider } from '@/services/react/ServiceProvider';
import {
    BaseServiceSuffix,
    getMsgChannelSelector,
    MsgProviderAdapter,
    ToMsgChannelPrefix,
    ToMsgStruct,
} from '@actdim/msgmesh/adapters';

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

// AppMsgStruct &
export type ComponentMsgStruct = ApiMsgStruct;

export type ComponentMsgChannels<
    TChannel extends keyof ComponentMsgStruct | Array<keyof ComponentMsgStruct>,
> = KeysOf<ComponentMsgStruct, TChannel>;

export const ApiServiceProvider = () => ServiceProvider({ adapters: msgProviderAdapters });
// global provider
// export const apiServiceProvider =  createServiceProvider(appMsgBus, msgProviderAdapters);

type Struct = ComponentStruct<
    ComponentMsgStruct,
    {
        props: {
            dataItems: DataItem[];
        };
        msgScope: {
            subscribe: ComponentMsgChannels<'API.TEST.GETDATAITEMS'>;
            publish: ComponentMsgChannels<'API.TEST.GETDATAITEMS'>;
        };
    }
>;

export const useServiceCallExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function loadData() {
        const msg = await c.msgBus.request({
            channel: 'API.TEST.GETDATAITEMS',
            payloadFn: (fn) => fn([1, 2], ['first', 'second']),
            // payload: [
            //     [1, 2],
            //     ['first', 'second'],
            // ],
        });
        m.dataItems = msg.payload;
    }

    async function clear() {
        m.dataItems.length = 0;
    }

    const def: ComponentDef<Struct> = {
        regType: 'ServiceCallExample',
        props: {
            dataItems: [],
        },
        events: {
            onReady: (c) => {
                loadData();
            },
        },
        view: () => {
            return (
                <div id={c.id}>
                    <button onClick={loadData}>Load data</button>
                    <button onClick={clear}>Clear</button>
                    <ul>
                        {m.dataItems.map((item) => (
                            <li>
                                {item.id}: {item.name}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type ServiceCallExampleStruct = Struct;
export const ServiceCallExample = toReact(useServiceCallExample);
