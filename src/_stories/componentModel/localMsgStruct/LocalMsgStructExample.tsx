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
import { TodoEditStruct, useTodoEdit } from './todoEdit';
import { TodoListStruct, useTodoList } from './todoList';
import { LocalMsgChannels, LocalMsgStruct, TodoItem } from './localMsgStruct';

type Struct = ComponentStruct<
    LocalMsgStruct,
    {
        props: {
            data: TodoItem[];
        };
        children: {
            todoEdit: TodoEditStruct;
            todoList: TodoListStruct;
        };
        msgScope: {
            provide: LocalMsgChannels<'ADD-TODO-ITEM' | 'CLEAR-TODO-ITEMS' | 'GET-TODO-ITEMS'>;
        };
    }
>;

export const useLocalMsgStructExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;
    const def: ComponentDef<Struct> = {
        props: {
            data: [],
        },
        msgBroker: {
            provide: {
                'ADD-TODO-ITEM': {
                    in: {
                        callback: (msg) => {
                            const newItem = msg.payload;
                            const item = m.data.find((item) => item.id === newItem.id);
                            if (item) {
                                item.name = newItem.name;
                            } else {
                                m.data.push(newItem);
                            }
                            m.data = m.data.slice();
                        },
                    },
                },
                'CLEAR-TODO-ITEMS': {
                    in: {
                        callback: (msg) => {
                            m.data = [];
                        },
                    },
                },
                'GET-TODO-ITEMS': {
                    in: {
                        callback: (msg) => {
                            return m.data;
                        },
                    },
                },
            },
        },

        children: {
            todoEdit: useTodoEdit({}),
            todoList: useTodoList({}),
        },

        view: (_, c) => {
            return (
                <>
                    Edit:
                    <c.children.todoEdit.View></c.children.todoEdit.View>
                    List:
                    <c.children.todoList.View></c.children.todoList.View>
                </>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type LocalMsgStructExampleStruct = Struct;
export const LocalMsgStructExampleFC = getFC(useLocalMsgStructExample);
