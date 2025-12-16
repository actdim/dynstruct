import { ClientBase } from "@/net/client";
import { MsgBus, MsgBusStruct } from "@actdim/msgmesh/msgBusCore";
import { Func } from "@actdim/utico/typeCore";

const getMethodNames = (client: any) => {
    // return new Set(...)
    return Object.getOwnPropertyNames(client).filter(
        (name) => name !== 'constructor' && typeof client[name] === 'function',
    );
};
const baseMethodNames = getMethodNames(ClientBase.prototype);

export type MsgBusProviderAdapter = {
    service: any;
    // channelSelector/channelMapper
    channelResolver: (methodName: string) => string;
};

export type MsgBusAdapterConfig = {
    providers: MsgBusProviderAdapter[]
};

export function registerAdapters<TMsgBusStruct extends MsgBusStruct = MsgBusStruct>(msgBus: MsgBus<TMsgBusStruct>, { providers }: MsgBusAdapterConfig) {
    if (providers) {
        for (const adapter of providers) {
            const { service, channelResolver } = adapter;
            if (!service || !!channelResolver) {
                throw new Error("client and channelResolver are required for an adapter")
            }
            for (const methodName of getMethodNames(Object.getPrototypeOf(service))) {
                const channel = channelResolver?.(methodName);
                if (channel) {
                    msgBus.provide({
                        channel: channel as keyof TMsgBusStruct,
                        topic: '/.*/',
                        callback: (msg) => {
                            return (service[methodName] as Func)(...((msg.payload || []) as any[]));
                        },
                    });
                }
            }
        }
    }
}