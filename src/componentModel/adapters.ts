import { ClientBase } from "@/net/client";
import { MsgBus, MsgStruct } from "@actdim/msgmesh/msgBusCore";
import { Func, RemoveSuffix } from "@actdim/utico/typeCore";

const getMethodNames = (client: any) => {
    // return new Set(...)
    return Object.getOwnPropertyNames(client).filter(
        (name) => name !== 'constructor' && typeof client[name] === 'function',
    );
};

const baseMethodNames = getMethodNames(ClientBase.prototype);

// ServiceMsgDispatcher
export type MsgProviderAdapter = {
    service: Disposable;
    // channelResolver/channelMapper
    channelSelector: (service: any, methodName: string) => string;
};

export function registerAdapters<TMsgStruct extends MsgStruct = MsgStruct>(msgBus: MsgBus<TMsgStruct>, adapters: MsgProviderAdapter[], abortSignal?: AbortSignal) {
    if (adapters) {
        for (const adapter of adapters) {
            const { service, channelSelector } = adapter;
            if (!service || !channelSelector) {
                throw new Error("Service and channelSelector are required for an adapter")
            }
            for (const methodName of getMethodNames(Object.getPrototypeOf(service))) {
                const channel = channelSelector?.(service, methodName);
                if (channel) {
                    msgBus.provide({
                        channel: channel as keyof TMsgStruct,
                        topic: '/.*/',
                        callback: (msg) => {
                            return (service[methodName] as Func)(...((msg.payload || []) as any[]));
                        },
                        config: {
                            abortSignal: abortSignal
                        }
                    });
                }
            }
        }
    }
}

export const BASE_API_CHANNEL_PREFIX = 'API_' as const;
type BaseApiChannelPrefix = typeof BASE_API_CHANNEL_PREFIX;

type BaseApiClientSuffix = 'CLIENT' | 'API';

export type ToApiChannelPrefix<
    T extends string,
    Prefix extends string = BaseApiChannelPrefix,
    Suffix extends string = BaseApiClientSuffix,
> = `${Prefix}${RemoveSuffix<Uppercase<T>, Suffix>}_`;