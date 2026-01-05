import {
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
    Component,
    ComponentModel,
} from '@/componentModel/componentModel';
import { PersistentStore } from '@actdim/utico/store/persistentStore';
import { BaseAppMsgChannels, BaseAppMsgStruct, useBaseAppContext } from '@/appDomain/appContracts';
import type { ComponentDef } from '@/componentModel/componentModel';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: {
            name?: string;
        };
        msgScope: {
            provide: BaseAppMsgChannels<
                'APP-KV-STORE-GET' | 'APP-KV-STORE-SET' | 'APP-KV-STORE-REMOVE'
            >;
        };
    }
>;

export const useStorageService = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function _updateStoreAsync() {
        store = await PersistentStore.openAsync(m.name);
    }

    let store: PersistentStore;
    let ready: () => void;
    const init = new Promise<void>((res) => {
        ready = res;
    });

    const def: ComponentDef<Struct> = {
        props: {
            name: '',
        },
        msgBroker: {
            provide: {
                'APP-KV-STORE-GET': {
                    in: {
                        callback: async (msg) => {
                            await init;
                            const item = await store.getAsync(msg.payload.key);
                            return item?.data.value;
                        },
                    },
                },
                'APP-KV-STORE-SET': {
                    in: {
                        callback: async (msg) => {
                            await init;
                            await store.setAsync(
                                {
                                    key: msg.payload.key,
                                },
                                msg.payload.value,
                            );
                        },
                    },
                },
                'APP-KV-STORE-REMOVE': {
                    in: {
                        callback: async (msg) => {
                            await init;
                            await store.deleteAsync(msg.payload.key);
                        },
                    },
                },
            },
        },
        events: {
            onChangeName: () => {
                _updateStoreAsync();
            },
        },
    };

    c = useComponent(def, params);
    m = c.model;
    _updateStoreAsync().then(() => ready());
    return c;
};

export type StorageServiceStruct = Struct;
export const StorageServiceFC = getFC(useStorageService);
