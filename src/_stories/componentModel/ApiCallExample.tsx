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
import { AddPrefix, Diff, Filter, Func, KeysOf, ToUpper } from '@actdim/utico/typeCore';
import { ClientBase, extractApiName } from '@/net/client';
import { BaseApiMsgStruct } from '@/appDomain/appContracts';
import { MsgStructFactory } from '@actdim/msgmesh/msgBusCore';
import { BASE_API_CHANNEL_PREFIX, ToApiChannelPrefix } from '@/componentModel/adapters';
import { removeSuffix } from '@actdim/utico/utils';

// MergedApi
type PureApiClient = Filter<
    ToUpper<
        AddPrefix<Diff<TestApiClient, ClientBase>, ToApiChannelPrefix<typeof TestApiClient.name>>
        // & ...
    >,
    Func
>;

const suffixes = ['CLIENT', 'API'];
const apiPrefixMap = new Map<any, string>([
    [
        TestApiClient.prototype,
        `${BASE_API_CHANNEL_PREFIX}${removeSuffix(TestApiClient.name.toUpperCase(), suffixes)}_`,
    ],
    // , ...
]);

export const apiChannelSelector = (client: any, methodName: string) => {
    let prefix = apiPrefixMap.get(Object.getPrototypeOf(client));
    if (prefix == undefined) {
        // return undefined;
        prefix = `${extractApiName(client.name, suffixes)}_`;
    }
    return `${prefix}${methodName.toUpperCase()}`;
};

const clients = [new TestApiClient()];

export type ApiMsgStruct = BaseApiMsgStruct &
    MsgStructFactory<{
        [K in keyof PureApiClient as Uppercase<K extends string ? K : never>]: {
            in: Parameters<PureApiClient[K]>;
            out: ReturnType<PureApiClient[K]>;
        };
    }>;

export type ComponentMsgStruct = AppMsgStruct & ApiMsgStruct;

export type ComponentMsgChannels<
    TChannel extends keyof ComponentMsgStruct | Array<keyof ComponentMsgStruct>,
> = KeysOf<ComponentMsgStruct, TChannel>;

type Struct = ComponentStruct<
    ComponentMsgStruct,
    {
        props: {
            dataItems: DataItem[];
        };
        actions: {};
        children: {};
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

        actions: {},

        events: {},

        msgBroker: {},

        children: {},

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
