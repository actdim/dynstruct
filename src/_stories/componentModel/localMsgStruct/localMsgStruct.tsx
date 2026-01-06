import { MsgStructFactory } from '@actdim/msgmesh/msgBusCore';
import { KeysOf } from '@actdim/utico/typeCore';

export type TodoItem = { id: number; name: string };

export type LocalMsgStruct = MsgStructFactory<{
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
}>; // & AppMsgStruct ...

export type LocalMsgChannels<TChannel extends keyof LocalMsgStruct | Array<keyof LocalMsgStruct>> =
    KeysOf<LocalMsgStruct, TChannel>;
