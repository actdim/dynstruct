import {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { AppMsgStruct } from './bootstrap'; // appDomain
import { DataItem, TestApiClient } from './TestApiClient';
import { KeysOf } from '@actdim/utico/typeCore';
import { ClientBase } from '@/net/client';
import {
    BaseServiceSuffix,
    ToMsgStruct,
    ToMsgChannelPrefix,
    MsgProviderAdapter,
    getMsgChannelSelector,
} from '@/componentModel/adapters';

type ServiceSuffix = BaseServiceSuffix;

type TestApiChannelPrefix = ToMsgChannelPrefix<typeof TestApiClient.name, 'API_', ServiceSuffix>;

type ApiMsgStruct = ToMsgStruct<
    TestApiClient,
    TestApiChannelPrefix,
    'extraMethod'
    // 'extraMethod' | keyof ClientBase
>;

export const services: Record<TestApiChannelPrefix, any> = {
    API_TEST_: new TestApiClient(),
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

type Struct = ComponentStruct<
    ComponentMsgStruct,
    {
        props: {
            dataItems: DataItem[];
        };
        msgScope: {
            subscribe: ComponentMsgChannels<'API_TEST_GETDATAITEMS'>;
            publish: ComponentMsgChannels<'API_TEST_GETDATAITEMS'>;
        };
    }
>;

export const useApiCallExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            dataItems: [],
        },

        view: (_, c) => {
            return (
                <div>
                    <button
                        onClick={async () => {
                            const msg = await c.msgBus.dispatchAsync({
                                channel: 'API_TEST_GETDATAITEMS',
                                payloadFn: (fn) => fn([1, 2], ['first', 'second']),
                                // payload: [
                                //     [1, 2],
                                //     ['first', 'second'],
                                // ],
                            });
                            m.dataItems = msg.payload;
                        }}
                    >
                        Request
                    </button>
                    <button
                        onClick={() => {
                            m.dataItems = [];
                        }}
                    >
                        Clear
                    </button>
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

export type ApiCallExampleStruct = Struct;
export const ApiCallExampleFC = getFC(useApiCallExample);
