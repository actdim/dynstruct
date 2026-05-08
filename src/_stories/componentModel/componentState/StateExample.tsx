import type {
    Component,
    ComponentDef,
    ComponentStructExt,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { TestMsgChannels, TestMsgStruct } from './msgStruct';
import { detailsStyle, labelStyle, row } from '../styles';
import { requestFakeData } from './TestApiClient';
import { bind, prop } from '@/componentModel/core';
import { AvatarViewStruct, useAvatarView } from './AvatarView';
import avatar1 from './avatar1.jpg';
import avatar2 from './avatar2.jpg';

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

export const useComponentStateExample = (params: ComponentParams<Struct>): Component<Struct> => {
    type ImplStruct = ComponentStructExt<
        Struct,
        {
            props: {
                data: string[];
                userInfo: {
                    email: string;
                    avatarUrl: string;
                };
            };
            children: {
                avatarView: AvatarViewStruct;
                section1: React.FC;
                section2: React.FC;
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
            // userInfo: {
            //     email: '',
            // },
            userInfo: prop({
                initialValue: {
                    email: 'john.smith@mail.com',
                    avatarUrl: avatar1,
                },
            }),
            'userInfo.email': prop({
                initialValue: 'john.smith@mail.com',
                validator: {
                    onBlur: true,
                    validate: (v: string) => {
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
        children: {
            avatarView: useAvatarView({
                'avatar.imageUrl': bind(() => m.userInfo.avatarUrl),
            }),
            section1: () => {
                const emailState = m.$.propState['userInfo.email'] || {};
                return (
                    <details open style={detailsStyle}>
                        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Form</summary>
                        <div style={row}>
                            <span style={labelStyle}>Email</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <input
                                    type="email"
                                    {...c.mapToEdit('userInfo.email')}
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
                        <div style={row}>
                            <span style={labelStyle}>Avatar</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <select {...c.mapToEdit<HTMLSelectElement>('userInfo.avatarUrl')}>
                                    <option value={avatar1}>Example 1</option>
                                    <option value={avatar2}>Example 2</option>
                                </select>
                                <c.children.AvatarView></c.children.AvatarView>
                            </div>
                        </div>
                    </details>
                );
            },
            section2: () => {
                const isBusy = m.$.pendingRequestCount > 0;
                return (
                    <details open style={detailsStyle}>
                        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Busy State</summary>
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
                );
            },
        },
        view: () => {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <c.children.Section1 />
                    <c.children.Section2 />
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
