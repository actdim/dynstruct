import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { CustomMsgChannels, CustomMsgHeaders, CustomMsgStruct, TodoItem } from './CustomMsgStruct';
import { detailsStyle } from '../styles';

type Struct = ComponentStruct<
    CustomMsgStruct,
    {
        props: {
            list: TodoItem[];
        };
        msgScope: {
            publish: CustomMsgChannels<'GET-TODO-ITEMS'>;
            subscribe: CustomMsgChannels<'ADD-TODO-ITEM' | 'CLEAR-TODO-ITEMS'>;
        };
    }
>;

export const useTodoList = (params: ComponentParams<Struct>) => {
    let c: Component<Struct, CustomMsgHeaders>;
    let m: ComponentModel<Struct>;

    async function update() {
        const msg = await c.msgBus.request({
            channel: 'GET-TODO-ITEMS',
        });
        m.list = msg.payload;
    }

    const def: ComponentDef<Struct, CustomMsgHeaders> = {
        props: {
            list: [],
        },

        msgBroker: {
            subscribe: {
                'ADD-TODO-ITEM': {
                    out: {
                        callback: async () => {
                            await update();
                        },
                    },
                },
                'CLEAR-TODO-ITEMS': {
                    out: {
                        callback: async () => {
                            await update();
                        },
                    },
                },
            },
        },

        view: () => {
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Todo List</summary>
                    <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                        {m.list.map((item) => (
                            <li key={item.id}>{item.id}: {item.name}</li>
                        ))}
                    </ul>
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type TodoListStruct = Struct;
export const TodoList = toReact(useTodoList);
