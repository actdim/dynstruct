import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { MsgStruct } from '@actdim/msgmesh/contracts';
import { KeysOf } from '@actdim/utico/typeCore';

export type TestMsgStruct = MsgStruct<{
    'DATA-REQUEST': {
        in: string;
        out: string[];
    };
}> & BaseAppMsgStruct;

export type TestMsgChannels<TChannel extends keyof TestMsgStruct | Array<keyof TestMsgStruct>> =
    KeysOf<TestMsgStruct, TChannel>;
