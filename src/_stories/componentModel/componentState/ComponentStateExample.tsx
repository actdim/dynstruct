import type {
    Component,
    ComponentDef,
    ComponentImplStruct,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { TestMsgChannels, TestMsgStruct } from './msgStruct';
import { detailsStyle, labelStyle, row } from '../styles';
import { requestFakeData } from './TestApiClient';
import { prop } from '@/componentModel/core';

type Struct = ComponentStruct<
    TestMsgStruct,
    {
        msgScope: {
            provide: TestMsgChannels<'DATA-REQUEST'>;
            publish: TestMsgChannels<'DATA-REQUEST'>;
            subscribe: TestMsgChannels<'DATA-REQUEST'>;
        };
    }
>;

export const useComponentStateExample = (params: ComponentParams<Struct>) => {
    type ImplStruct = ComponentImplStruct<
        Struct,
        {
            data: string[];
            form: {
                email: string;
            };
        }
    >;

    let c: Component<ImplStruct>;
    let m: ComponentModel<ImplStruct>;

    async function requestMoreData() {
        const msg = await c.msgBus.request({ channel: 'DATA-REQUEST' });
        m.data.push(...msg.payload);
    }

    const def: ComponentDef<ImplStruct> = {
        props: {
            data: [],
            // form: {
            //     email: '',
            // },
            form: prop({
                initialValue: {
                    email: 'a@b.mail.com',
                },
            }),
            'form.email': prop<string>({
                validator: {
                    onBlur: true,
                    validate: (v) => {
                        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '');
                        return valid ? undefined : { isValid: false, message: 'Invalid email' };
                    },
                },
            }),
        },
        msgBroker: {
            provide: {
                'DATA-REQUEST': {
                    in: {
                        callback: requestFakeData,
                    },
                },
            },
        },
        view: () => {
            const isBusy = m.$.pendingRequestCount > 0;
            const emailState = m.$.propState['form.email'] || {};
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <details open style={detailsStyle}>
                        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Form</summary>
                        <div style={row}>
                            <span style={labelStyle}>Email</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <input
                                    type="email"
                                    {...c.mapToInput('form.email')}
                                    style={{
                                        borderColor: emailState.error ? '#e53935' : undefined,
                                        outline: emailState.error ? '1px solid #e53935' : undefined,
                                    }}
                                />
                                {emailState.error && (
                                    <span style={{ color: '#e53935', fontSize: 11 }}>
                                        {emailState.error}
                                    </span>
                                )}
                            </div>
                        </div>
                    </details>
                    <details open style={detailsStyle}>
                        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                            Component State
                        </summary>
                        <div style={{ ...row, marginTop: 4 }}>
                            <button onClick={requestMoreData} disabled={isBusy}>
                                Request More
                            </button>
                            {isBusy && (
                                <span style={{ color: '#888', fontSize: 12, fontStyle: 'italic' }}>
                                    Loading…
                                </span>
                            )}
                        </div>
                        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                            {m.data.map((item, i) => (
                                <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </details>
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type ComponentStateExampleStruct = Struct;
export const ComponentStateExample = toReact(useComponentStateExample);
