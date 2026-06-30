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
    // $AUTH_INFO_CHANGED,
    $CONFIG_GET as $SECURITY_CONFIG_GET,
    $CONFIG_CHANGED as $SECURITY_CONFIG_CHANGED,
    BearerSignInCredentials,
    SignInCredentials,
    BearerAuthInfo,
    $AUTH_APPLY,
    BasicAuthInfo,
} from '@/appDomain/securityContracts';
import { getValuePrefixer } from '@actdim/utico/typeCore';
import { jwtDecode } from 'jwt-decode';
import { IRequestParams } from '@/net/request';
import { HttpClientError } from '@/net/httpClientError';
import {
    $STORE_GET,
    $STORE_REMOVE,
    $STORE_SET,
    $NAV_GOTO,
    BaseSecurityDomainConfig,
} from '@/appDomain/commonContracts';
import httpStatus from 'http-status';

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
    ComponentRegistryContext,
    ComponentStruct,
} from '@/componentModel/contracts';
import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { AsyncLock } from '@actdim/utico/asyncLock';
import { HttpClient } from '@/net/httpClient';
import { useComponentContext } from '@/componentModel/react/componentContext';

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
                | typeof $AUTH_APPLY
            >;
            publish: BaseAppMsgChannels<
                // | typeof $CONFIG_GET
                | typeof $NAV_GOTO
                | typeof $SECURITY_CONFIG_GET
                | typeof $STORE_SET
                | typeof $STORE_GET
                | typeof $STORE_REMOVE
                // | typeof $AUTH_INFO_CHANGED
                | typeof $AUTH_SIGNIN_REQUEST
                | typeof $AUTH_SIGNOUT_REQUEST
                | typeof $AUTH_REFRESH_REQUEST
            >;
        };
    }
>;

const lock = new AsyncLock();

const defaultAuthInfo: AuthInfo = {
    scheme: 'Bearer',
};

export const useSecurityService = (params: ComponentParams<Struct>): Component<Struct> => {
    type Internals = {
        storageKeys?: typeof baseStorageKeys;
        httpСlient: HttpClient;
    };

    let c: ComponentImpl<Struct, Internals>;
    let m: ComponentModel<Struct>;

    const context = useComponentContext() as ComponentRegistryContext<BaseAppMsgStruct>;

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

    async function resetData() {
        m.authInfo = defaultAuthInfo;
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
            m.authInfo = authInfo;
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
        resetData();
        // await saveData();
    }

    async function ensureAuth() {
        // await init();

        let authInfo: AuthInfo;
        const signIn = async () => {
            const msg = await c.msgBus.once({
                channel: $AUTH_SIGNIN,
                group: 'out',
            });
            authInfo = msg.payload;
        };

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

        await Promise.race([signIn(), signOut()]);
        return authInfo;
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

        if (!url) {
            throw new Error(
                'Sign in endpoint is not configured (domainConfig.endpoints.authSignIn)',
            );
        }

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
            // signal: c.abortSignal
        };

        const json = await c._.httpСlient.fetch<unknown>(requestParams);

        loadBearerAuthInfo(json);
    }

    async function signIn(credentials: SignInCredentials, authInfo?: AuthInfo) {
        await init();

        if (authInfo) {
            m.authInfo = authInfo;
        }

        if (m.useConventions) {
            // && m.domainConfig.endpoints.authSignIn
            const scheme = credentials.scheme || m.authInfo.scheme;
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

            m.authInfo = msg.payload;
        }

        await saveData();

        return await getAuthInfo();
    }

    async function bearerSignOut() {
        const authInfo = m.authInfo as BearerAuthInfo;

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
            // signal: c.abortSignal
        };

        await c._.httpСlient.fetch<void>(requestParams);
    }

    async function signOut(authInfo?: AuthInfo) {
        await init();

        if (authInfo) {
            m.authInfo = authInfo;
        }

        if (m.useConventions) {
            // && m.domainConfig.endpoints.authSignOut
            switch (m.authInfo.scheme) {
                case 'Bearer':
                    await bearerSignOut();
                    break;
            }
        } else {
            await c.msgBus.request({
                channel: $AUTH_SIGNOUT_REQUEST,
                payload: m.authInfo,
            });
        }

        await clearSavedData();
    }

    async function bearerRefreshAuth() {
        const authInfo = m.authInfo as BearerAuthInfo;

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
            // signal: c.abortSignal
        };

        const json = await c._.httpСlient.fetch<unknown>(requestParams);

        loadBearerAuthInfo(json);
    }

    async function refreshAuth(authInfo?: AuthInfo) {
        await init();

        if (authInfo) {
            m.authInfo = authInfo;
        }

        if (m.useConventions) {
            // && m.domainConfig.endpoints.authRefresh
            switch (m.authInfo.scheme) {
                case 'Bearer':
                    await bearerRefreshAuth();
                    break;
            }
        } else {
            const msg = await c.msgBus.request({
                channel: $AUTH_REFRESH_REQUEST,
                payload: m.authInfo,
            });

            m.authInfo = msg.payload;
        }

        await saveData();

        return await getAuthInfo();
    }

    async function applyBearerAuth(request: BaseAppMsgStruct[typeof $AUTH_APPLY]['in']) {
        let authInfo = m.authInfo as BearerAuthInfo;

        const result: BaseAppMsgStruct[typeof $AUTH_APPLY]['out'] = {
            headers: {},
            credentials: 'include',
            query: {},
        };

        if (!authInfo?.accessToken) {
            const msg = await c.msgBus.request({
                channel: 'APP.SECURITY.AUTH.ENSURE',
            });
            authInfo = msg.payload as BearerAuthInfo;
        }

        // if (!authInfo?.accessToken) {
        //     throw HttpClientError.create({
        //         status: httpStatus.UNAUTHORIZED,
        //     });
        // }

        if (authInfo?.accessToken) {
            const authorizationHeader = 'Authorization';
            const headerValue = `Bearer ${authInfo.accessToken}`;
            result.headers[authorizationHeader] = headerValue;
        }

        return result;
    }

    async function applyBasicAuth(request: BaseAppMsgStruct[typeof $AUTH_APPLY]['in']) {
        let authInfo = m.authInfo as BasicAuthInfo;

        const result: BaseAppMsgStruct[typeof $AUTH_APPLY]['out'] = {
            headers: {},
            credentials: 'include',
            query: {},
        };

        let accessToken: string = null;
        if (!authInfo?.accessToken) {
            const msg = await c.msgBus.request({
                channel: 'APP.SECURITY.AUTH.ENSURE',
            });
            authInfo = msg.payload as BasicAuthInfo;
        }

        accessToken = authInfo?.accessToken;

        if (authInfo && !accessToken) {
            if (authInfo.userName && authInfo.password) {
                accessToken = btoa(`${authInfo.userName}:${authInfo.password}`);
            }
        }

        // if (!accessToken) {
        //     throw HttpClientError.create({
        //         status: httpStatus.UNAUTHORIZED,
        //     });
        // }

        if (accessToken) {
            const authorizationHeader = 'Authorization';
            const headerValue = `Basic ${accessToken}`;
            result.headers[authorizationHeader] = headerValue;
        }

        return result;
    }

    function applyAuth(
        request: BaseAppMsgStruct[typeof $AUTH_APPLY]['in'],
    ): Promise<BaseAppMsgStruct[typeof $AUTH_APPLY]['out']> {
        // TODO: support "WWW-Authenticate" header from the server ("WWW-Authenticate: Bearer" etc)
        const authInfo = m.authInfo;
        if (m.useConventions) {
            switch (authInfo.scheme) {
                case 'Basic':
                    return applyBasicAuth(request);
                case 'Bearer':
                    return applyBearerAuth(request);
                default:
                    throw new Error(`Unsupported auth scheme: ${authInfo.scheme}`);
                // Authorization: Digest ...
                // Authorization: Negotiate ...
                // Authorization: ApiKey ...
                // X-API-Key
                // X-Auth-Token
            }
        }
        return undefined;
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
            authInfo: defaultAuthInfo,
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
                        callback: () => {
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
                        callback: () => {
                            return ensureAuth();
                        },
                    },
                },
                [$AUTH_APPLY]: params.useConventions
                    ? {
                          in: {
                              callback: (inMsg, outMsg) => {
                                  //   if (!m.useConventions) {
                                  //       outMsg.status = 'skipped';
                                  //       return undefined;
                                  //   }
                                  return applyAuth(inMsg.payload);
                              },
                          },
                      }
                    : undefined,
            },
        },
        events: {
            onReady: () => {
                const httpClient = new HttpClient(context);
                httpClient.baseUrl = window.location.origin;
                c._.httpСlient = httpClient;
            },
        },
    };

    c = useComponent(def, params, {
        storageKeys: { ...baseStorageKeys },
    } as Internals);
    m = c.model;
    return c;
};

export type SecurityServiceStruct = Struct;
export const SecurityService: React.FC<ComponentParams<Struct>> = toReact(useSecurityService);
