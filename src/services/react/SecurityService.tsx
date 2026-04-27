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
import { AsyncLock } from '@actdim/utico/asyncLock';

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

const lock = new AsyncLock();

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
        c._.domainConfig = config;
        const prefixer = getValuePrefixer<typeof c._.storageKeys>(
            `${c._.domainConfig?.id}/`,
        );
        c._.storageKeys = prefixer(c._.storageKeys);
        await restoreData();
    }

    function getSessionInternal(): AuthSession {
        return {
            accessToken: c._.accessToken,
            refreshToken: c._.refreshToken,
            authInfo: c._.authInfo,
            authProvider: c._.authProvider,
            domain: c._.domain,
            tokenExpiresAt: c._.tokenExpiresAt,
        };
    }

    async function init() {
        await lock.dispatch(async () => {
            if (!c._.domainConfig) {
                await updateConfig();
            }
        });

        if (c._.accessToken) {
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
                key: c._.storageKeys.accessToken,
            },
        });
        c._.accessToken = msg.payload?.data.value as string;

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c._.storageKeys.refreshToken,
            },
        });
        c._.refreshToken = msg.payload?.data.value as string;

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c._.storageKeys.userCredentials,
            },
        });
        c._.userCredentials = (msg.payload?.data.value as UserCredentials) || {
            userName: null,
            password: null,
        };

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c._.storageKeys.authInfo,
            },
        });
        c._.authInfo = msg.payload?.data.value;

        msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c._.storageKeys.acl,
            },
        });
        c._.acl = msg.payload?.data.value || null;
    }

    // removeSavedData
    async function clearSavedData() {
        c._.accessToken = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c._.storageKeys.accessToken,
            },
        });
        c._.refreshToken = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c._.storageKeys.refreshToken,
            },
        });
        c._.userCredentials = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c._.storageKeys.userCredentials,
            },
        });
        c._.authInfo = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c._.storageKeys.authInfo,
            },
        });
        c._.acl = null;
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c._.storageKeys.acl,
            },
        });
        // await saveData();
    }

    async function ensureAuth() {
        // await init();

        c._.accessToken = null;
        c._.acl = null;

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
                path: c._.domainConfig.routes.authSignInPage,
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
                key: c._.storageKeys.accessToken,
                value: c._.accessToken || null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c._.storageKeys.refreshToken,
                value: c._.refreshToken || null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c._.storageKeys.userCredentials,
                value: c._.userCredentials ? c._.userCredentials : null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c._.storageKeys.authInfo,
                value: c._.authInfo ? c._.authInfo : null,
            },
        });
        await c.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: c._.storageKeys.acl,
                value: c._.acl ? c._.acl : null,
            },
        });
    }

    function loadAuthInfo(json: unknown) {
        c._.authInfo = json;

        const accessToken = json['access_token'] || json['accessToken'] || json['token'];
        const refreshToken = json['refresh_token'] || json['refreshToken'];
        // const userInfo = json['user'];
        // const tokenType = json['token_type'] || json['tokenType'];
        // const expiresAt = json['expires_at'] || json['expiresAt'];

        c._.accessToken = accessToken;
        c._.refreshToken = refreshToken;
        // c.internals.acl = ...;
    }

    // setSession
    function loadSession(session: AuthSession) {
        c._.accessToken = session.accessToken;
        c._.refreshToken = session.refreshToken;
        c._.authInfo = session.authInfo;
        c._.authProvider = session.authProvider;
        c._.domain = session.domain;
        c._.tokenExpiresAt = session.tokenExpiresAt;
    }

    async function signIn(credentials: UserCredentials) {
        await init();

        if (!m.useConventions) {
            let url = c._.domainConfig.routes?.authSignIn;

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

            c._.userCredentials = credentials;

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
            let url = c._.domainConfig.routes?.authSignOut;
            if (url) {
                url = url.replace(/[?&]$/, '');
            }

            const content = JSON.stringify({ accessToken: c._.accessToken });

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
                    accessToken: c._.accessToken,
                },
            });
        }

        await clearSavedData();
    }

    async function refreshAuth(refreshToken1?: string) {
        await init();

        if (!m.useConventions) {
            let url = c._.domainConfig.routes?.authRefresh;
            if (url) {
                url = url.replace(/[?&]$/, '');
            }

            const content = JSON.stringify({
                refreshToken: c._.refreshToken,
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
                    refreshToken: c._.refreshToken,
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
