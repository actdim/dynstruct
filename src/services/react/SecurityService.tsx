import {
    UserCredentials,
    AuthSession,
    $AUTH_SIGNIN,
    $AUTH_SIGNOUT_REQUEST,
    $AUTH_SIGNOUT,
    $AUTH_SIGNIN_REQUEST,
    $AUTH_REFRESH,
    $AUTH_REFRESH_REQUEST,
    $AUTH_ENSURE,
    $AUTH_SESSION_GET,
    $AUTH_SESSION_CHANGED,
    $CONFIG_GET as $SECURITY_CONFIG_GET,
    $CONFIG_CHANGED as $SECURITY_CONFIG_CHANGED,
} from '@/appDomain/securityContracts';
import { getValuePrefixer } from '@actdim/utico/typeCore';
import { jwtDecode } from 'jwt-decode';
import { getResponseResult, IRequestParams, IRequestState, IResponseState } from '@/net/request';
import { ApiError } from '@/net/apiError';
import {
    $STORE_GET,
    $STORE_REMOVE,
    $STORE_SET,
    $NAV_GOTO,
    BaseSecurityDomainConfig,
} from '@/appDomain/commonContracts';

const userNameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

// JwtTokenPayload
type TokenPayload = {
    [userNameClaim]: string;
};

// Access denied
// Insufficient privileges to perform this operation
// const defaultAccessDeniedReason = 'Insufficient privileges. Contact your system Administrator.';

const baseStorageKeys = {
    accessToken: 'ACCESS_TOKEN',
    refreshToken: 'REFRESH_TOKEN',
    acl: 'ACL',
    userCredentials: 'USER_CREDENTIALS',
    // signInInfo
    authInfo: 'AUTH_INFO',
};

function decodeJWTToken<T extends TokenPayload>(token: string): T {
    if (!token) {
        return null;
    }
    try {
        return jwtDecode<T>(token);
    } catch {
        // something wrong with the token
        return null;
    }
}

import { PropsWithChildren } from 'react';
import {
    Component,
    ComponentDef,
    ComponentImpl,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import { AsyncMutex } from '@actdim/utico/asyncMutex';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: PropsWithChildren & {
            // useStandardConventions
            useConventions: boolean;
        };
        msgScope: {
            subscribe: BaseAppMsgChannels<typeof $SECURITY_CONFIG_CHANGED>;
            provide: BaseAppMsgChannels<
                | typeof $AUTH_SIGNIN
                | typeof $AUTH_SIGNOUT
                | typeof $AUTH_REFRESH
                | typeof $AUTH_SESSION_GET
                | typeof $AUTH_ENSURE
            >;
            publish: BaseAppMsgChannels<
                // | typeof $CONFIG_GET
                | typeof $NAV_GOTO
                | typeof $SECURITY_CONFIG_GET
                | typeof $STORE_SET
                | typeof $STORE_GET
                | typeof $STORE_REMOVE
                | typeof $AUTH_SESSION_CHANGED
                | typeof $AUTH_SIGNIN_REQUEST
                | typeof $AUTH_SIGNOUT_REQUEST
                | typeof $AUTH_REFRESH_REQUEST
            >;
        };
    }
>;

const mutex = new AsyncMutex();

export const useSecurityService = (params: ComponentParams<Struct>): Component<Struct> => {
    type Internals = {
        // isAuthenticated?: boolean;
        // isExpired?: boolean;
        domain?: string;
        domainConfig?: BaseSecurityDomainConfig;
        storageKeys?: typeof baseStorageKeys;
        accessToken?: string;
        refreshToken?: string;
        userCredentials?: UserCredentials;
        authInfo?: any;
        // authority?: string;
        authProvider?: string;
        tokenExpiresAt?: string;
        // RBAC vs ABAC vs PBAC: https://habr.com/ru/companies/otus/articles/698080/
        acl?: any;
    };

    let c: ComponentImpl<Struct, Internals>;
    let m: ComponentModel<Struct>;

    let fetcher: { fetch(url: RequestInfo, init?: RequestInit): Promise<Response> } = window;

    async function updateConfig(config?: BaseSecurityDomainConfig) {
        if (!config) {
            // const msg = await c.msgBus.request({
            //     channel: $CONFIG_GET,
            // });
            // config = msg.payload.security;
            const msg = await c.msgBus.request({
                channel: $SECURITY_CONFIG_GET,
            });
            config = msg.payload;
        }
        c.internals.domainConfig = config;
        const prefixer = getValuePrefixer<typeof c.internals.storageKeys>(
            `${c.internals.domainConfig?.id}/`,
        );
        c.internals.storageKeys = prefixer(c.internals.storageKeys);
        await restoreData();
    }

    function getSessionInternal(): AuthSession {
        return {
            accessToken: c.internals.accessToken,
            refreshToken: c.internals.refreshToken,
            authInfo: c.internals.authInfo,
            authProvider: c.internals.authProvider,
            domain: c.internals.domain,
            tokenExpiresAt: c.internals.tokenExpiresAt,
        };
    }

    async function init() {
        await mutex.dispatch(async () => {
            if (!c.internals.domainConfig) {
                await updateConfig();
            }
        });

        if (c.internals.accessToken) {
            const session = getSessionInternal();
            c.msgBus.send({
                channel: $AUTH_SIGNIN,
                group: 'out',
                payload: session,
            });
        }
    }

    async function getSession(): Promise<AuthSession> {
        await init();
        return getSessionInternal();
    }

    async function restoreData() {
        let msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c.internals.storageKeys.accessToken,
            },
        });
        c.internals.accessToken = msg.payload?.data.value as string;

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c.internals.storageKeys.refreshToken,
            },
        });
        c.internals.refreshToken = msg.payload?.data.value as string;

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c.internals.storageKeys.userCredentials,
            },
        });
        c.internals.userCredentials = (msg.payload?.data.value as UserCredentials) || {
            userName: null,
            password: null,
        };

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c.internals.storageKeys.authInfo,
            },
        });
        c.internals.authInfo = msg.payload?.data.value;

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c.internals.storageKeys.acl,
            },
        });
        c.internals.acl = msg.payload?.data.value || null;
    }

    // removeSavedData
    async function clearSavedData() {
        c.internals.accessToken = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c.internals.storageKeys.accessToken,
            },
        });
        c.internals.refreshToken = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c.internals.storageKeys.refreshToken,
            },
        });
        c.internals.userCredentials = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c.internals.storageKeys.userCredentials,
            },
        });
        c.internals.authInfo = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c.internals.storageKeys.authInfo,
            },
        });
        c.internals.acl = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c.internals.storageKeys.acl,
            },
        });
        // await saveData();
    }

    async function ensureAuth() {
        // await init();

        c.internals.accessToken = null;
        c.internals.acl = null;

        const signIn = c.msgBus.once({
            channel: $AUTH_SIGNIN,
            group: 'out',
        });

        const signOut = async () => {
            await c.msgBus.once({
                channel: $AUTH_SIGNOUT,
                group: 'out',
            });
            throw new Error('Auth failed: login aborted');
        };

        c.msgBus.send({
            channel: $NAV_GOTO,
            payload: {
                path: c.internals.domainConfig.routes.authSignInPage,
                params: {
                    callbackUrl:
                        window.location.pathname + window.location.search + window.location.hash,
                },
            },
        });

        await Promise.race([signIn, signOut]);
    }

    async function saveData() {
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c.internals.storageKeys.accessToken,
                value: c.internals.accessToken || null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c.internals.storageKeys.refreshToken,
                value: c.internals.refreshToken || null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c.internals.storageKeys.userCredentials,
                value: c.internals.userCredentials ? c.internals.userCredentials : null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c.internals.storageKeys.authInfo,
                value: c.internals.authInfo ? c.internals.authInfo : null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c.internals.storageKeys.acl,
                value: c.internals.acl ? c.internals.acl : null,
            },
        });
    }

    function loadAuthInfo(json: unknown) {
        c.internals.authInfo = json;

        const accessToken = json['access_token'] || json['accessToken'] || json['token'];
        const refreshToken = json['refresh_token'] || json['refreshToken'];
        // const userInfo = json['user'];
        // const tokenType = json['token_type'] || json['tokenType'];
        // const expiresAt = json['expires_at'] || json['expiresAt'];

        c.internals.accessToken = accessToken;
        c.internals.refreshToken = refreshToken;
        // c.internals.acl = ...;
    }

    // setSession
    function loadSession(session: AuthSession) {
        c.internals.accessToken = session.accessToken;
        c.internals.refreshToken = session.refreshToken;
        c.internals.authInfo = session.authInfo;
        c.internals.authProvider = session.authProvider;
        c.internals.domain = session.domain;
        c.internals.tokenExpiresAt = session.tokenExpiresAt;
    }

    async function signIn(credentials: UserCredentials) {
        await init();

        if (!m.useConventions) {
            let url = c.internals.domainConfig.routes?.authSignIn;

            url = url.replace(/[?&]$/, '');

            const content = JSON.stringify({
                grant_type: 'password',
                username: credentials.userName,
                password: credentials.password,
            });

            // TODO: support other schemas
            // application/x-www-form-urlencoded?
            // ?userName=&password=
            // userName:password (BASIC)

            const requestParams: IRequestParams = {
                url: url,
                body: content,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/plain',
                },
            };

            const request: IRequestState = {
                ...requestParams,
                status: 'executing',
            };

            const response: IResponseState = await fetcher.fetch(url, requestParams);
            await getResponseResult(response, request);
            ApiError.assert(response, request);

            c.internals.userCredentials = credentials;

            const json = response.resolved.json;

            loadAuthInfo(json);
        } else {
            const msg = await c.msgBus.request({
                channel: $AUTH_SIGNIN_REQUEST,
                payload: credentials,
            });

            loadSession(msg.payload);
        }

        await saveData();

        return await getSession();
    }

    async function signOut(accessToken?: string) {
        await init();

        if (!m.useConventions) {
            let url = c.internals.domainConfig.routes?.authSignOut;
            if (url) {
                url = url.replace(/[?&]$/, '');
            }

            const content = JSON.stringify({ accessToken: c.internals.accessToken });

            const requestParams: IRequestParams = {
                url: url,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/plain',
                },
                body: content,
            };

            const request: IRequestState = {
                ...requestParams,
                status: 'executing',
            };

            const response: IResponseState = await fetcher.fetch(url, requestParams);
            await getResponseResult(response, request);
            ApiError.assert(response, request);
        } else {
            await c.msgBus.request({
                channel: $AUTH_SIGNOUT_REQUEST,
                payload: {
                    accessToken: c.internals.accessToken,
                },
            });
        }

        await clearSavedData();
    }

    async function refreshAuth(refreshToken1?: string) {
        await init();

        if (!m.useConventions) {
            let url = c.internals.domainConfig.routes?.authRefresh;
            if (url) {
                url = url.replace(/[?&]$/, '');
            }

            const content = JSON.stringify({
                refreshToken: c.internals.refreshToken,
                // refresh_token: c.internals.refreshToken
            });

            const requestParams: IRequestParams = {
                url: url,
                body: content,
                method: 'POST',
                // useAuth: true,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/plain',
                },
            };

            const request: IRequestState = {
                ...requestParams,
                status: 'executing',
            };

            const response: IResponseState = await fetcher.fetch(url, requestParams);
            await getResponseResult(response, request);
            ApiError.assert(response, request);

            const json = response.resolved.json;

            loadAuthInfo(json);
        } else {
            const msg = await c.msgBus.request({
                channel: $AUTH_REFRESH_REQUEST,
                payload: {
                    refreshToken: c.internals.refreshToken,
                },
            });

            loadSession(msg.payload);
        }

        await saveData();

        return await getSession();
    }

    // async function getAcl<T extends ISecurable>(obj: T) {
    //     await init();
    //     return {
    //         [AccessLevel.Full]: ""
    //     } as IAccessDescriptor;
    // }
    // // authorize
    // async function verifyAccess<T extends ISecurable>(obj: T, accessLevel = AccessLevel.Full) {
    //     const acl = getAcl(obj);
    //     ...
    // }

    const def: ComponentDef<Struct> = {
        props: {
            useConventions: true,
        },
        msgBroker: {
            subscribe: {
                [$SECURITY_CONFIG_CHANGED]: {
                    in: {
                        callback: async (msg) => {
                            await updateConfig(msg.payload);
                        },
                    },
                },
            },
            provide: {
                [$AUTH_SESSION_GET]: {
                    in: {
                        callback: (msg) => {
                            return getSession();
                        },
                    },
                },
                [$AUTH_SIGNIN]: {
                    in: {
                        callback: (msg) => {
                            return signIn(msg.payload);
                        },
                    },
                },
                [$AUTH_SIGNOUT]: {
                    in: {
                        callback: (msg) => {
                            return signOut(msg.payload?.accessToken);
                        },
                    },
                },
                [$AUTH_REFRESH]: {
                    in: {
                        callback: (msg) => {
                            return refreshAuth(msg.payload?.refreshToken);
                        },
                    },
                },
                [$AUTH_ENSURE]: {
                    in: {
                        callback: (msg) => {
                            return ensureAuth();
                        },
                    },
                },
            },
        },
        events: {},
    };

    c = useComponent(def, params, {
        storageKeys: { ...baseStorageKeys },
    } as Internals);
    m = c.model;
    return c;
};

export type SecurityServiceStruct = Struct;
export const SecurityService: React.FC<ComponentParams<Struct>> = toReact(useSecurityService);
