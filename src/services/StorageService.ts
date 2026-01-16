import { PersistentStore } from '@actdim/utico/store/persistentStore';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { MsgBus } from '@actdim/msgmesh/contracts';

export async function createStorageService(msgBus: MsgBus<BaseAppMsgStruct>, storeName: string, abortSignal?: AbortSignal) {

    const abortController = new AbortController();
    if (abortSignal) {
        abortSignal = AbortSignal.any([abortSignal, abortController.signal]);
    }

    const getStore = () => {
        return PersistentStore.open(storeName);
    }

    msgBus.provide({
        channel: 'APP-KV-STORE-GET',
        group: "in",
        options: {
            abortSignal
        },
        callback: async (msg) => {
            const store = await getStore();
            return await store.get(msg.payload.key);
        }
    });

    msgBus.provide({
        channel: 'APP-KV-STORE-SET',
        group: "in",
        options: {
            abortSignal
        },
        callback: async (msg) => {
            const store = await getStore();
            await store.set(
                {
                    key: msg.payload.key,
                },
                msg.payload.value,
            );
        }
    });

    msgBus.provide({
        channel: 'APP-KV-STORE-REMOVE',
        group: "in",
        options: {
            abortSignal
        },
        callback: async (msg) => {
            const store = await getStore();
            await store.delete(msg.payload.key);
        }
    });

    return {
        storeName,
        abortSignal
    }
};