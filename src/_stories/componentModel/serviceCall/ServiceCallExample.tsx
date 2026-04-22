import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { DataItem } from './TestApiClient';

import { CustomMsgChannels, CustomMsgStruct } from './ApiServiceProvider';
import { detailsStyle, row } from '../styles';

type Struct = ComponentStruct<
    CustomMsgStruct,
    {
        props: {
            dataItems: DataItem[];
        };
        msgScope: {
            subscribe: CustomMsgChannels<'API.TEST.GETDATAITEMS'>;
            publish: CustomMsgChannels<'API.TEST.GETDATAITEMS'>;
        };
    }
>;

export const useServiceCallExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function loadData() {
        const msg = await c.msgBus.request({
            channel: 'API.TEST.GETDATAITEMS',
            payloadFn: (fn) => fn([1, 2], ['first', 'second']),
            // payload: [
            //     [1, 2],
            //     ['first', 'second'],
            // ],
        });
        m.dataItems = msg.payload;
    }

    async function clear() {
        m.dataItems.length = 0;
    }

    const def: ComponentDef<Struct> = {
        regType: 'ServiceCallExample',
        props: {
            dataItems: [],
        },
        events: {
            onReady: (c) => {
                loadData();
            },
        },
        view: () => {
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>API Call</summary>
                    <div style={{ ...row, marginTop: 4 }}>
                        <button onClick={loadData}>Load data</button>
                        <button onClick={clear}>Clear</button>
                    </div>
                    <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                        {m.dataItems.map((item) => (
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

export type ServiceCallExampleStruct = Struct;
export const ServiceCallExample = toReact(useServiceCallExample);
