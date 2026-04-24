import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { LoginDialogStruct, useLoginDialog } from './LoginDialog';
import { SecurityDemoMsgChannels, SecurityDemoMsgStruct } from './SecureApiServiceProvider';
import { AuthSession } from '@/appDomain/securityContracts';
import { detailsStyle, labelStyle, row } from '../styles';

type Struct = ComponentStruct<
    SecurityDemoMsgStruct,
    {
        props: {
            showLoginDialog: boolean;
            activeUser: string;
            responseData: string;
        };
        children: {
            loginDialog: LoginDialogStruct;
        };
        msgScope: {
            subscribe: SecurityDemoMsgChannels<
                'APP.SECURITY.AUTH.SIGNIN' | 'APP.SECURITY.AUTH.SIGNOUT'
            >;
            provide: SecurityDemoMsgChannels<
                | 'APP.SECURITY.AUTH.SIGNIN.REQUEST'
                | 'APP.SECURITY.AUTH.SIGNOUT.REQUEST'
                | 'APP.NAV.GOTO'
            >;
            publish: SecurityDemoMsgChannels<
                | 'API.SECURE.GETDATA'
                | 'APP.SECURITY.AUTH.SESSION.GET'
                | 'APP.SECURITY.AUTH.SIGNIN'
                | 'APP.SECURITY.AUTH.SIGNOUT'
                | 'APP.SECURITY.AUTH.ENSURE'
            >;
        };
    }
>;

export const useSecurityServiceExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function updateActiveUser() {
        const msg = await c.msgBus.request({
            channel: 'APP.SECURITY.AUTH.SESSION.GET',
        });
        m.activeUser = msg.payload?.authInfo?.user_name || msg.payload?.authInfo?.email;
    }

    const def: ComponentDef<Struct> = {
        regType: 'SecurityServiceExample',
        props: {
            showLoginDialog: false,
            activeUser: '',
            responseData: '',
        },
        msgBroker: {
            subscribe: {
                'APP.SECURITY.AUTH.SIGNIN': {
                    out: {
                        callback: async () => {
                            await updateActiveUser();
                        },
                    },
                },
                'APP.SECURITY.AUTH.SIGNOUT': {
                    out: {
                        callback: async () => {
                            await updateActiveUser();
                        },
                    },
                },
            },
            provide: {
                'APP.NAV.GOTO': {
                    in: {
                        callback: (msg) => {
                            if (msg.payload.path == '/login') {
                                // msg.payload.params;
                                m.showLoginDialog = true;
                            }
                        },
                    },
                },
                'APP.SECURITY.AUTH.SIGNIN.REQUEST': {
                    in: {
                        callback: (msg) => {
                            if (
                                (msg.payload.userName === 'admin' ||
                                    msg.payload.email === 'admin@mail.com') &&
                                msg.payload.password === 'admin'
                            ) {
                                return {
                                    accessToken: 'token',
                                    authInfo: {
                                        user_name: msg.payload.userName || msg.payload.email,
                                        email: msg.payload.email,
                                    },
                                } as AuthSession;
                            }
                            throw new Error('Invalid credentials');
                        },
                    },
                },
                'APP.SECURITY.AUTH.SIGNOUT.REQUEST': {
                    in: {
                        callback: (msg) => {},
                    },
                },
            },
        },
        events: {
            onReady: async (c) => {
                await c.msgBus.request({
                    channel: 'APP.SECURITY.AUTH.SIGNOUT',
                });
                await updateActiveUser();
            },
            onCatch: (_, err) => {
                // console.error(err); // for debug
            },
        },
        children: {
            loginDialog: useLoginDialog({
                onSubmit: async ({ email, password }) => {
                    try {
                        m.showLoginDialog = false;
                        const msg = await c.msgBus.request({
                            channel: 'APP.SECURITY.AUTH.SIGNIN',
                            payload: {
                                email,
                                password,
                            },
                        });
                        alert(`Login success. Token: {${msg.payload.accessToken}}`);
                        await updateActiveUser();
                    } catch (err) {
                        alert(`Login failed: ${err.message}`);
                    }
                },
            }),
        },
        view: () => {
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                        Security Service
                    </summary>
                    <div style={{ ...row, fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                        Credentials: email "admin@mail.com", password "admin"
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>User</span>
                        <span>
                            {m.activeUser || <i style={{ color: '#aaa' }}>Not authenticated</i>}
                        </span>
                    </div>
                    <div style={{ ...row, marginTop: 8 }}>
                        {!m.activeUser && (
                            <button
                                onClick={async () => {
                                    await c.msgBus.request({ channel: 'APP.SECURITY.AUTH.ENSURE' });
                                }}
                            >
                                Login
                            </button>
                        )}
                        {m.activeUser && (
                            <button
                                onClick={async () => {
                                    await c.msgBus.request({
                                        channel: 'APP.SECURITY.AUTH.SIGNOUT',
                                    });
                                }}
                            >
                                Logout
                            </button>
                        )}
                        <button
                            onClick={async () => {
                                const msg = await c.msgBus.request({
                                    channel: 'API.SECURE.GETDATA',
                                    payloadFn: (r) => r('foo'),
                                });
                                m.responseData = JSON.stringify(msg.payload);
                            }}
                        >
                            Get secure data
                        </button>
                    </div>
                    {m.responseData && (
                        <div style={row}>
                            <span style={labelStyle}>Data</span>
                            <textarea
                                name="data"
                                value={m.responseData}
                                readOnly
                                style={{ flex: 1 }}
                            />
                        </div>
                    )}
                    {m.showLoginDialog && <c.children.LoginDialog />}
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type ServiceServiceExampleStruct = Struct;
export const SecurityServiceExample = toReact(useSecurityServiceExample);
