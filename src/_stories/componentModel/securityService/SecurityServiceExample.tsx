import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentMsgStruct,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { LoginDialogStruct, useLoginDialog } from './LoginDialog';
import { SecurityDemoMsgChannels, SecurityDemoMsgStruct } from './SecureApiServiceProvider';
import { AuthSession } from '@/appDomain/securityContracts';

type Struct = ComponentStruct<
    SecurityDemoMsgStruct,
    {
        props: {
            showLoginDialog: boolean;
            activeUser: string;
        };
        children: {
            loginDialog: LoginDialogStruct;
        };
        msgScope: {
            subscribe: SecurityDemoMsgChannels<'API.SECURE.GETDATA'>;
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
        m.activeUser = msg.payload?.authInfo?.user_name || '<Not authenticated>';
    }

    const def: ComponentDef<Struct> = {
        regType: 'SecurityServiceExample',
        props: {
            showLoginDialog: false,
            activeUser: '',
        },        
        msgBroker: {
            subscribe: {
                'API.SECURE.GETDATA': {
                    error: {
                        callback: (msg) => {
                            console.log(msg);
                        },
                        topic: 'msgbus',
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
                                        user_name: msg.payload.userName,
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
                const msg = await c.msgBus.request({
                    channel: 'APP.SECURITY.AUTH.SIGNOUT',
                });
                await updateActiveUser();
            },
            onError: (_, err) => {
                console.error("!!!!!!!!!!!!");
            }
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
                <div id={c.id}>
                    <div>Current session user: {m.activeUser}</div>
                    <div>
                        <button
                            onClick={async () => {
                                try {
                                    const data = await c.msgBus.request({
                                        channel: 'API.SECURE.GETDATA',
                                        payloadFn: (r) => r('foo'),
                                    });
                                } catch (err) {
                                    console.log(err);
                                }
                            }}
                        >
                            Get secure data
                        </button>
                    </div>
                    {m.showLoginDialog && <c.children.loginDialog.View />}
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type ServiceServiceExampleStruct = Struct;
export const SecurityServiceExample = toReact(useSecurityServiceExample);
