import {
    ComponentParams,
    ComponentStruct,
    Component,
    ComponentModel,
    ComponentDef,
} from '@/componentModel/contracts';
import { getFC, useComponent } from '@/componentModel/react';
import { PersistentStore } from '@actdim/utico/store/persistentStore';
import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import { PropsWithChildren } from 'react';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: PropsWithChildren & {
            storeName?: string;
        };
        msgScope: {
            provide: BaseAppMsgChannels<'APP.STORE.GET' | 'APP.STORE.SET' | 'APP.STORE.REMOVE'>;
        };
    }
>;

export const useStorageService = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function _updateStore() {
        store = await PersistentStore.open(m.storeName);
    }

    let store: PersistentStore;
    let ready: () => void;
    const init = new Promise<void>((res) => {
        ready = res;
    });

    const def: ComponentDef<Struct> = {
        props: {
            storeName: '',
        },
        msgBroker: {
            provide: {
                'APP.STORE.GET': {
                    in: {
                        callback: async (msg) => {
                            await init;
                            const item = await store.get(msg.payload.key);                            
                            return item;
                        },
                    },
                },
                'APP.STORE.SET': {
                    in: {
                        callback: async (msg) => {
                            await init;
                            await store.set(
                                {
                                    key: msg.payload.key,
                                },
                                msg.payload.value,
                            );
                        },
                    },
                },
                'APP.STORE.REMOVE': {
                    in: {
                        callback: async (msg) => {
                            await init;
                            await store.delete(msg.payload.key);
                        },
                    },
                },
            },
        },
        events: {
            onChangeStoreName: () => {
                _updateStore();
            },
        },
    };

    c = useComponent(def, params);
    m = c.model;
    _updateStore().then(() => ready());
    return c;
};

export type StorageServiceStruct = Struct;
export const StorageService: React.FC<ComponentParams<Struct>> = getFC(useStorageService);
