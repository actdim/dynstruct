import { ClientBase } from "@/net/client";
import { MsgBus, MsgStruct } from "@actdim/msgmesh/msgBusCore";
import { Func } from "@actdim/utico/typeCore";

const getMethodNames = (client: any) => {
    // return new Set(...)
    return Object.getOwnPropertyNames(client).filter(
        (name) => name !== 'constructor' && typeof client[name] === 'function',
    );
};
const baseMethodNames = getMethodNames(ClientBase.prototype);

export type MsgProviderAdapter = {
    service: any;
    // channelSelector/channelMapper
    channelResolver: (methodName: string) => string;
};

export type MsgBusAdapterConfig = {
    providers: MsgProviderAdapter[]
};

export function registerAdapters<TMsgStruct extends MsgStruct = MsgStruct>(msgBus: MsgBus<TMsgStruct>, { providers }: MsgBusAdapterConfig) {
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
                        channel: channel as keyof TMsgStruct,
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