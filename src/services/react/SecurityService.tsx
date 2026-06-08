import {
    AuthInfo,
    $AUTH_SIGNIN,
    $AUTH_SIGNOUT_REQUEST,
    $AUTH_SIGNOUT,
    $AUTH_SIGNIN_REQUEST,
    $AUTH_REFRESH,
    $AUTH_REFRESH_REQUEST,
    $AUTH_ENSURE,
    $AUTH_INFO_GET,
    $AUTH_INFO_CHANGED,
    $CONFIG_GET as $SECURITY_CONFIG_GET,
    $CONFIG_CHANGED as $SECURITY_CONFIG_CHANGED,
    BearerSignInCredentials,
    SignInCredentials,
    BearerAuthInfo,
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
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { AsyncLock } from '@actdim/utico/asyncLock';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: PropsWithChildren & {
            // useStandardConventions
            useConventions: boolean;
            domainConfig?: BaseSecurityDomainConfig;
            authInfo?: AuthInfo;
        };
        msgScope: {
            subscribe: BaseAppMsgChannels<typeof $SECURITY_CONFIG_CHANGED>;
            provide: BaseAppMsgChannels<
                | typeof $AUTH_SIGNIN
                | typeof $AUTH_SIGNOUT
                | typeof $AUTH_REFRESH
                | typeof $AUTH_INFO_GET
                | typeof $AUTH_ENSURE
            >;
            publish: BaseAppMsgChannels<
                // | typeof $CONFIG_GET
                | typeof $NAV_GOTO
                | typeof $SECURITY_CONFIG_GET
                | typeof $STORE_SET
                | typeof $STORE_GET
                | typeof $STORE_REMOVE
                | typeof $AUTH_INFO_CHANGED
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
        storageKeys?: typeof baseStorageKeys;
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
        m.domainConfig = config;
        const prefixer = getValuePrefixer<typeof c._.storageKeys>(`${m.domainConfig?.id}/`);
        c._.storageKeys = prefixer(c._.storageKeys);
        await restoreData();
    }

    async function init() {
        await lock.dispatch(async () => {
            if (!m.domainConfig) {
                await updateConfig();
            }
        });

        if (m.authInfo?.isAuthenticated) {
            c.msgBus.send({
                channel: $AUTH_SIGNIN,
                group: 'out',
                payload: m.authInfo,
            });
        }
    }

    async function getAuthInfo(): Promise<AuthInfo> {
        await init();
        return m.authInfo;
    }

    async function restoreData() {
        let msg = await c.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: c._.storageKeys.authInfo,
            },
        });
        const authInfo = msg.payload?.data.value as AuthInfo;
        if (authInfo) {
            // m.authInfo = authInfo;
            Object.assign(m.authInfo, authInfo);
        }
    }

    // removeSavedData
    async function clearSavedData() {
        await c.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: c._.storageKeys.authInfo,
            },
        });
        // await saveData();
    }

    async function ensureAuth() {
        // await init();

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
                path: m.domainConfig.routes.authSignInPage,
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
                key: c._.storageKeys.authInfo,
                value: m.authInfo || null,
            },
        });
    }

    function loadBearerAuthInfo(json: unknown) {
        const authInfo = m.authInfo as BearerAuthInfo;
        const {
            access_token,
            accessToken,
            token,
            refresh_token,
            refreshToken,
            // user,
            // token_type,
            // tokenType,
            // expires_at,
            // expiresAt,
            ...rest
        } = json as Record<string, unknown>;
        authInfo.accessToken = (access_token || accessToken || token) as string;
        authInfo.refreshToken = (refresh_token || refreshToken) as string;
        authInfo.properties = Object.assign(authInfo.properties ?? {}, rest);
    }

    async function bearerSignIn(credentials: BearerSignInCredentials) {
        let url = m.domainConfig.endpoints?.authSignIn;

        url = url.replace(/[?&]$/, '');

        const content = JSON.stringify({
            grant_type: 'password',
            username: credentials.userName,
            password: credentials.password,
        });

        // application/x-www-form-urlencoded?

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
        const json = response.resolved.json;
        loadBearerAuthInfo(json);
    }

    async function signIn(credentials: SignInCredentials, authInfo?: AuthInfo) {
        await init();

        if (!authInfo) {
            authInfo = m.authInfo;
        }

        if (m.useConventions) {
            // && m.domainConfig.endpoints.authSignIn
            const scheme = credentials.scheme || authInfo.scheme;
            switch (scheme) {
                case 'Bearer':
                    await bearerSignIn(credentials as BearerSignInCredentials);
                    break;
            }
        } else {
            const msg = await c.msgBus.request({
                channel: $AUTH_SIGNIN_REQUEST,
                payload: {
                    credentials: credentials,
                    auth: m.authInfo,
                },
            });

            Object.assign(m.authInfo, msg.payload);
        }

        await saveData();

        return await getAuthInfo();
    }

    async function bearerSignOut(authInfo?: BearerAuthInfo) {
        if (!authInfo) {
            authInfo = m.authInfo as BearerAuthInfo;
        }

        let url = m.domainConfig.endpoints?.authSignOut;
        if (!url) {
            throw new Error(
                'Sign out endpoint is not configured (domainConfig.endpoints.authSignOut)',
            );
        }
        url = url.replace(/[?&]$/, '');

        const content = JSON.stringify({ accessToken: authInfo.accessToken });

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
    }

    async function signOut(authInfo?: AuthInfo) {
        await init();

        if (!authInfo) {
            authInfo = m.authInfo;
        }

        if (m.useConventions) {
            // && m.domainConfig.endpoints.authSignOut
            switch (authInfo.scheme) {
                case 'Bearer':
                    await bearerSignOut(authInfo);
                    break;
            }
        } else {
            await c.msgBus.request({
                channel: $AUTH_SIGNOUT_REQUEST,
                payload: authInfo,
            });
        }

        m.authInfo = {
            scheme: m.authInfo.scheme,
        };

        await clearSavedData();
    }

    async function bearerRefreshAuth(authInfo?: BearerAuthInfo) {
        if (!authInfo) {
            authInfo = m.authInfo as BearerAuthInfo;
        }

        let url = m.domainConfig.endpoints?.authRefresh;
        if (url) {
            url = url.replace(/[?&]$/, '');
        }

        const content = JSON.stringify({
            refreshToken: authInfo.refreshToken,
            // refresh_token: authInfo.refreshToken
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

        loadBearerAuthInfo(json);
    }

    async function refreshAuth(authInfo?: AuthInfo) {
        await init();

        if (!authInfo) {
            authInfo = m.authInfo;
        }

        if (m.useConventions) {
            // && m.domainConfig.endpoints.authRefresh
            switch (authInfo.scheme) {
                case 'Bearer':
                    await bearerRefreshAuth(authInfo);
                    break;
            }
        } else {
            const msg = await c.msgBus.request({
                channel: $AUTH_REFRESH_REQUEST,
                payload: authInfo,
            });

            Object.assign(authInfo, msg.payload);
        }

        await saveData();

        return await getAuthInfo();
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
            authInfo: {
                scheme: 'Bearer',
            },
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
                [$AUTH_INFO_GET]: {
                    in: {
                        callback: (msg) => {
                            return getAuthInfo();
                        },
                    },
                },
                [$AUTH_SIGNIN]: {
                    in: {
                        callback: (msg) => {
                            return signIn(msg.payload.credentials, msg.payload.auth);
                        },
                    },
                },
                [$AUTH_SIGNOUT]: {
                    in: {
                        callback: (msg) => {
                            return signOut(msg.payload);
                        },
                    },
                },
                [$AUTH_REFRESH]: {
                    in: {
                        callback: (msg) => {
                            return refreshAuth(msg.payload);
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
