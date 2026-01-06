import {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
} from '@/componentModel/componentModel';
import React from 'react';
import { LocalMsgChannels, LocalMsgStruct, TodoItem } from './localMsgStruct';

type Struct = ComponentStruct<
    LocalMsgStruct,
    {
        props: {
            list: TodoItem[];
        };
        msgScope: {
            publish: LocalMsgChannels<'GET-TODO-ITEMS'>;
            subscribe: LocalMsgChannels<'ADD-TODO-ITEM' | 'CLEAR-TODO-ITEMS'>;
        };
    }
>;

export const useTodoList = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function _updateAsync() {
        const msg = await c.msgBus.dispatchAsync({
            channel: 'GET-TODO-ITEMS',
        });
        m.list = msg.payload;
    }

    const def: ComponentDef<Struct> = {
        props: {
            list: [],
        },

        msgBroker: {
            subscribe: {
                'ADD-TODO-ITEM': {
                    out: {
                        callback: async () => {
                            await _updateAsync();
                        },
                    },
                },
                'CLEAR-TODO-ITEMS': {
                    out: {
                        callback: async () => {
                            await _updateAsync();
                        },
                    },
                },
            },
        },

        view: (_, c) => {
            return (
                <ul>
                    {m.list.map((item) => (
                        <li>
                            <>{item.id}</>:<>{item.name}</>
                        </li>
                    ))}
                </ul>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type TodoListStruct = Struct;
export const TodoListFC = getFC(useTodoList);
