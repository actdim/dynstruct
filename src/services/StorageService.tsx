import {
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
    Component,
    ComponentModel,
} from '@actdim/dynstruct/componentModel/componentModel';
import { PersistentStore } from '@actdim/utico/store/persistentStore';
import { BaseAppBusChannels, BaseAppBusStruct, useBaseAppContext } from '@/appDomain/appContracts';

type Struct = ComponentStruct<
    BaseAppBusStruct,
    {
        props: {
            name?: string;
        };
        msgScope: {
            provide: BaseAppBusChannels<
                'APP-KV-STORE-GET' | 'APP-KV-STORE-SET' | 'APP-KV-STORE-REMOVE'
            >;
        };
    }
>;

export const useStorageService = (params: ComponentParams<Struct>) => {

    let model: ComponentModel<Struct>;

    let store: PersistentStore;
    let ready: () => void;
    const init = new Promise<void>((res) => {
        ready = res;
    });

    const component: Component<Struct> = {
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

    model = useComponent(component, params);
    _updateStoreAsync().then(() => ready());
    return model;

    async function _updateStoreAsync() {
        store = await PersistentStore.openAsync(model.name);
    }
};

export type StorageServiceStruct = Struct;
export const StorageServiceFC = getFC(useStorageService);
