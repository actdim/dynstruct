import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { getFC, useComponent } from '@/componentModel/react';
import React from 'react';
import { LocalMsgChannels, LocalMsgStruct, TodoItem } from './localMsgStruct';

type Struct = ComponentStruct<
    LocalMsgStruct,
    {
        props: {
            item: TodoItem;
        };

        msgScope: {
            publish: LocalMsgChannels<'ADD-TODO-ITEM' | 'CLEAR-TODO-ITEMS' | 'GET-TODO-ITEMS'>;
        };
    }
>;

export const useTodoEdit = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;
    const def: ComponentDef<Struct> = {
        props: {
            item: { id: 1, name: 'Wake Up' },
        },

        view: (_, c) => {
            return (
                <>
                    <p>
                        ID:
                        <input
                            type="number"
                            value={m.item.id}
                            onChange={(e) => {
                                m.item.id = +e.target.value;
                            }}
                        ></input>
                    </p>
                    <p>
                        Name:
                        <input
                            type="text"
                            value={m.item.name}
                            onChange={(e) => {
                                m.item.name = e.target.value;
                            }}
                        ></input>
                    </p>
                    <p>
                        <button
                            onClick={() => {
                                c.msgBus.send({
                                    channel: 'ADD-TODO-ITEM',
                                    payload: m.item,
                                });
                            }}
                        >
                            Set
                        </button>
                        <button
                            onClick={() => {
                                c.msgBus.send({
                                    channel: 'CLEAR-TODO-ITEMS',
                                });
                            }}
                        >
                            Clear
                        </button>
                        <button
                            onClick={async () => {
                                const msg = await c.msgBus.request({
                                    channel: 'GET-TODO-ITEMS',
                                });
                                alert(JSON.stringify(msg.payload));
                            }}
                        >
                            Send
                        </button>
                    </p>
                </>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type TodoEditStruct = Struct;
export const TodoEdit = getFC(useTodoEdit);
