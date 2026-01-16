import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { MsgProviderAdapter, registerAdapters } from '../componentModel/adapters';
import { MsgBus } from '@actdim/msgmesh/contracts';

export function createServiceProvider(msgBus: MsgBus<BaseAppMsgStruct>, adapters?: MsgProviderAdapter[], abortSignal?: AbortSignal) {
    const abortController = new AbortController();
    if (abortSignal) {
        abortSignal = AbortSignal.any([abortSignal, abortController.signal]);
    }
    registerAdapters(msgBus, adapters, abortSignal);
    return {
        adapters,
        abortSignal
    }
}

