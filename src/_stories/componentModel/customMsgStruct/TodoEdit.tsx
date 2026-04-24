import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { CustomMsgChannels, CustomMsgHeaders, CustomMsgStruct, TodoItem } from './CustomMsgStruct';
import { detailsStyle, labelStyle, row } from '../styles';

type Struct = ComponentStruct<
    CustomMsgStruct,
    {
        props: {
            item: TodoItem;
            priority: number;
        };

        msgScope: {
            publish: CustomMsgChannels<'ADD-TODO-ITEM' | 'CLEAR-TODO-ITEMS' | 'GET-TODO-ITEMS'>;
        };
    }
>;

export const useTodoEdit = (params: ComponentParams<Struct>) => {
    let c: Component<Struct, CustomMsgHeaders>;
    let m: ComponentModel<Struct>;
    const def: ComponentDef<Struct, CustomMsgHeaders> = {
        props: {
            item: { id: 1, name: 'Wake Up' },
            priority: 0,
        },

        view: () => {
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Edit Todo</summary>
                    <div style={row}>
                        <span style={labelStyle}>ID</span>
                        <input
                            type="number"
                            value={m.item.id}
                            onChange={(e) => { m.item.id = +e.target.value; }}
                        />
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>Name</span>
                        <input
                            type="text"
                            value={m.item.name}
                            onChange={(e) => { m.item.name = e.target.value; }}
                        />
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>Priority</span>
                        <input
                            type="text"
                            value={m.priority}
                            onChange={(e) => { m.priority = +e.target.value; }}
                        />
                    </div>
                    <div style={{ ...row, marginTop: 10 }}>
                        <button
                            onClick={() => { c.msgBus.send({ channel: 'ADD-TODO-ITEM', payload: m.item, headers: { priority: m.priority } }); }}
                        >
                            Set
                        </button>
                        <button onClick={() => { c.msgBus.send({ channel: 'CLEAR-TODO-ITEMS' }); }}>
                            Clear
                        </button>
                        <button
                            onClick={async () => {
                                const msg = await c.msgBus.request({ channel: 'GET-TODO-ITEMS' });
                                alert(JSON.stringify(msg.payload));
                            }}
                        >
                            Get
                        </button>
                    </div>
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type TodoEditStruct = Struct;
export const TodoEdit = toReact(useTodoEdit);
