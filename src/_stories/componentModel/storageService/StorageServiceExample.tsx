import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { detailsStyle, labelStyle, row } from '../styles';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: {
            writeKey: string;
            valueToStore: string;
            status: string;
            readKey: string;
            valueFromStore: string;
        };
        msgScope: {
            provide: BaseAppMsgChannels<'APP.STORE.SET' | 'APP.STORE.GET'>;
        };
    }
>;


export const useStorageServiceExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;
    const def: ComponentDef<Struct> = {
        props: {
            writeKey: 'test',
            valueToStore: 'Example',
            status: '',
            readKey: 'test',
            valueFromStore: '',
        },
        view: () => {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <details open style={detailsStyle}>
                        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Write</summary>
                        <div style={row}>
                            <span style={labelStyle}>Key</span>
                            <input
                                type="text"
                                value={m.writeKey}
                                onChange={(e) => (m.writeKey = e.target.value)}
                            />
                        </div>
                        <div style={row}>
                            <span style={labelStyle}>Value</span>
                            <input
                                type="text"
                                value={m.valueToStore}
                                onChange={(e) => {
                                    m.status = '';
                                    m.valueToStore = e.target.value;
                                }}
                            />
                        </div>
                        <div style={{ ...row, marginTop: 10 }}>
                            <button
                                onClick={() => {
                                    c.msgBus.send({
                                        channel: 'APP.STORE.SET',
                                        payload: { key: m.writeKey, value: m.valueToStore },
                                    });
                                    m.valueToStore = '';
                                    m.status = 'OK';
                                }}
                            >
                                Write
                            </button>
                            {m.status && (
                                <span style={{ color: 'green', fontStyle: 'italic', fontSize: 12 }}>
                                    {m.status}
                                </span>
                            )}
                        </div>
                    </details>
                    <details open style={detailsStyle}>
                        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Read</summary>
                        <div style={row}>
                            <span style={labelStyle}>Key</span>
                            <input
                                type="text"
                                value={m.readKey}
                                onChange={(e) => (m.readKey = e.target.value)}
                            />
                        </div>
                        <div style={{ ...row, marginTop: 10 }}>
                            <button
                                onClick={async () => {
                                    const msg = await c.msgBus.request({
                                        channel: 'APP.STORE.GET',
                                        payload: { key: m.readKey },
                                    });
                                    m.valueFromStore = msg.payload.data.value as string;
                                }}
                            >
                                Read
                            </button>
                        </div>
                        <div style={row}>
                            <span style={labelStyle}>Value</span>
                            <input type="text" value={m.valueFromStore} readOnly={true} />
                        </div>
                    </details>
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type StorageServiceExampleStruct = Struct;
export const StorageServiceExample = toReact(useStorageServiceExample);
