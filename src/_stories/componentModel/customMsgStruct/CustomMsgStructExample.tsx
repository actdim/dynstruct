import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { TodoEditStruct, useTodoEdit } from './TodoEdit';
import { TodoListStruct, useTodoList } from './TodoList';
import { CustomMsgChannels, CustomMsgHeaders, CustomMsgStruct, TodoItem } from './CustomMsgStruct';

type Struct = ComponentStruct<
    CustomMsgStruct,
    {
        props: {
            data: TodoItem[];
        };
        children: {
            todoEdit: TodoEditStruct;
            todoList: TodoListStruct;
        };
        msgScope: {
            provide: CustomMsgChannels<'ADD-TODO-ITEM' | 'CLEAR-TODO-ITEMS' | 'GET-TODO-ITEMS'>;
        };
    }
>;

export const useCustomMsgStructExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct, CustomMsgHeaders>;
    let m: ComponentModel<Struct>;
    const def: ComponentDef<Struct, CustomMsgHeaders> = {
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
                                if (msg.headers.priority > 0) {
                                    m.data.splice(0, 0, newItem);
                                } else {
                                    m.data.push(newItem);
                                }
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

        view: () => {
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

export type CustomMsgStructExampleStruct = Struct;
export const CustomMsgStructExample = toReact(useCustomMsgStructExample);
