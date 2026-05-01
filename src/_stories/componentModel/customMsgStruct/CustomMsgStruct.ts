import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { ComponentMsgHeaders } from '@/componentModel/contracts';
import { MsgStruct } from '@actdim/msgmesh/contracts';
import { KeysOf } from '@actdim/utico/typeCore';

export type TodoItem = { id: number; name: string };

export type CustomMsgStruct = MsgStruct<{
    'ADD-TODO-ITEM': {
        in: TodoItem;
        out: void;
    };
    'GET-TODO-ITEMS': {
        in: void;
        out: TodoItem[];
    };
    'CLEAR-TODO-ITEMS': {
        in: void;
        out: void;
    };
}> & BaseAppMsgStruct;

export type CustomMsgChannels<TChannel extends keyof CustomMsgStruct | Array<keyof CustomMsgStruct>> =
    KeysOf<CustomMsgStruct, TChannel>;
export type CustomMsgHeaders = ComponentMsgHeaders & { priority: number };
