import {
    ComponentParams,
    ComponentStruct,
    Component,
    ComponentModel,
    ComponentDef,
    ComponentImpl,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import { PersistentStore } from '@actdim/utico/store/persistentStore';
import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import { PropsWithChildren } from 'react';
import { $STORE_GET, $STORE_REMOVE, $STORE_SET } from '@/appDomain/commonContracts';
import { AsyncLock } from '@actdim/utico/asyncLock';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: PropsWithChildren & {
            storeName?: string;
        };
        msgScope: {
            provide: BaseAppMsgChannels<
                typeof $STORE_GET | typeof $STORE_SET | typeof $STORE_REMOVE
            >;
        };
    }
>;

const lock = new AsyncLock();

export const useStorageService = (params: ComponentParams<Struct>): Component<Struct> => {
    type Internals = {
        store?: PersistentStore;
    };

    let c: ComponentImpl<Struct, Internals>;
    let m: ComponentModel<Struct>;

    async function init(forceUpdate = false) {
        await lock.dispatch(async () => {
            if (!c._.store || forceUpdate) {
                c._.store = await PersistentStore.open(m.storeName);
            }
        });
    }

    const def: ComponentDef<Struct> = {
        props: {
            storeName: '',
        },
        msgBroker: {
            provide: {
                [$STORE_GET]: {
                    in: {
                        callback: async (msg) => {
                            await init();
                            const item = await c._.store.get(msg.payload.key);
                            return item;
                        },
                    },
                },
                [$STORE_SET]: {
                    in: {
                        callback: async (msg) => {
                            await init();
                            await c._.store.set(
                                {
                                    key: msg.payload.key,
                                },
                                msg.payload.value,
                            );
                        },
                    },
                },
                [$STORE_REMOVE]: {
                    in: {
                        callback: async (msg) => {
                            await init();
                            await c._.store.delete(msg.payload.key);
                        },
                    },
                },
            },
        },
        events: {
            onReady: async () => {
                await init();
            },
            onChangeStoreName: async () => {
                await init(true);
            },
        },
    };

    c = useComponent(def, params, {} as Internals);
    m = c.model;
    return c;
};

export type StorageServiceStruct = Struct;
export const StorageService: React.FC<ComponentParams<Struct>> = toReact(useStorageService);
