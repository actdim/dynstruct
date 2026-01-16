import {
    AccessLevel,
    IAccessDescriptor,
    ISecurable,
    BaseSecurityDomainConfig,
    UserCredentials,
    SecurityTokens,
    SecurityContext
} from "./securityContracts";
import { getValuePrefixer } from "@actdim/utico/typeCore";
import { jwtDecode } from "jwt-decode";
import { getResponseResult, IRequestParams, IRequestState, IResponseState } from "@/net/request";
import { ApiError } from "@/net/apiError";
import { MsgBus } from "@actdim/msgmesh/contracts";
import { BaseAppMsgStruct } from "@/appDomain/appContracts";

const userNameClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

// JwtTokenPayload
type TokenPayload = {
    [userNameClaim]: string;
};

// Access denied
// Insufficient privileges to perform this operation
const defaultAccessDeniedReason = "Insufficient privileges. Contact your system Administrator.";

const storageKeys = {
    accessToken: "ACCESS_TOKEN",
    refreshToken: "REFRESH_TOKEN",
    acl: "ACL",
    userCredentials: "USER_CREDENTIALS",
    userInfo: "USER_INFO"
};

function decodeJWTToken<T extends TokenPayload>(token: string): T {
    if (!token) {
        return null;
    }
    try {
        return jwtDecode<T>(this.accessToken);
    } catch {
        // something wrong with the token
        return null;
    }
}

export class SecurityProvider<TUserInfo = any> {
    // private isAuthenticated: boolean;

    // private isExpired: boolean;

    private msgBus: MsgBus<BaseAppMsgStruct>;

    private domainConfig: BaseSecurityDomainConfig;

    private storageKeys: typeof storageKeys;

    private accessToken: string;

    private refreshToken: string;

    private userCredentials: UserCredentials;

    private userInfo: TUserInfo;

    // private authority: string;
    private authProvider: string;

    private tokenExpiresAt: string;

    // RBAC vs ABAC vs PBAC: https://habr.com/ru/companies/otus/articles/698080/
    private acl: any;

    private fetcher: { fetch(url: RequestInfo, init?: RequestInit): Promise<Response> } = window;

    private init: Promise<any>;

    constructor(msgBus: MsgBus<BaseAppMsgStruct>) {
        this.msgBus = msgBus;

        this.init = this.updateConfigAsync();

        // TODO: support custom requests

        this.msgBus.provide({
            channel: "APP-SECURITY-GET-CONTEXT",
            callback: (msg) => {
                return this.getContext();
            }
        });

        this.msgBus.provide({
            channel: "APP-SECURITY-GET-ACL",
            callback: (msg) => {
                return this.getAcl(msg.payload);
            }
        });

        this.msgBus.provide({
            channel: "APP-SECURITY-AUTH-SIGNIN",
            callback: (msg) => {
                return this.signInAsync(msg.payload);
            }
        });

        this.msgBus.provide({
            channel: "APP-SECURITY-AUTH-SIGNOUT",
            callback: (msg) => {
                return this.signOutAsync();
            }
        });

        this.msgBus.provide({
            channel: "APP-SECURITY-AUTH-REFRESH",
            callback: (msg) => {
                return this.refreshAsync();
            }
        });

        this.msgBus.provide({
            channel: "APP-SECURITY-REQUEST-AUTH",
            callback: (msg) => {
                return this.requestAuthorize();
            }
        });

        // HELPER
        this.msgBus.provide({
            channel: "APP-SECURITY-GET-CONFIG",
            callback: async (msg) => {
                return (
                    await this.msgBus.request({
                        channel: "APP-CONFIG-GET"
                    })
                ).payload?.security;
            }
        });
    }

    public getContext(): SecurityContext {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            userInfo: this.userInfo,
            authProvider: this.authProvider,
            domain: this.domain,
            tokenExpiresAt: this.tokenExpiresAt
        };
    }

    private async updateConfigAsync() {
        const msg = await this.msgBus.request({
            channel: "APP-CONFIG-GET"
        });
        this.domainConfig = msg.payload.security;
        const prefixer = getValuePrefixer<typeof storageKeys>(`${this.domainConfig.id}/`);
        this.storageKeys = prefixer(storageKeys);
        await this.restoreDataAsync();
    }

    async restoreDataAsync() {
        this.accessToken = (
            await this.msgBus.request({
                channel: "APP-KV-STORE-GET",
                payload: {
                    key: this.storageKeys.accessToken
                }
            })
        ).payload.data.value;
        this.refreshToken = (
            await this.msgBus.request({
                channel: "APP-KV-STORE-GET",
                payload: {
                    key: this.storageKeys.refreshToken
                }
            })
        ).payload.data.value;
        this.userCredentials = (
            await this.msgBus.request({
                channel: "APP-KV-STORE-GET",
                payload: {
                    key: this.storageKeys.userCredentials
                }
            })
        ).payload.data.value || {
            username: null,
            password: null
        };        

        this.acl = (
            await this.msgBus.request({
                channel: "APP-KV-STORE-GET",
                payload: {
                    key: this.storageKeys.acl
                }
            })
        ).payload.data.value || null;

        if (this.accessToken) {
            this.msgBus.request({
                channel: "APP-SECURITY-AUTH-SIGNIN",
                group: "out",
                payload: this.getContext()
            });
        }
    }

    public get domain(): string {
        return this.domainConfig.id;
    }

    // cleanUserAndActionsStorage = (): void => {
    //     const obsoleteKeysRegexMatch = /^(user|actions)@.+$/;
    //     for (let i = localStorage.length - 1; i >= 0; i--) {
    //         const key = localStorage.key(i);
    //         if (key && obsoleteKeysRegexMatch.test(key)) {
    //             localStorage.removeItem(key);
    //         }
    //     }
    // };

    // removeSavedData
    async clearSavedDataAsync() {
        this.accessToken = null;
        await this.msgBus.request({
            channel: "APP-KV-STORE-REMOVE",
            payload: {
                key: this.storageKeys.accessToken
            }
        });
        this.refreshToken = null;
        await this.msgBus.request({
            channel: "APP-KV-STORE-REMOVE",
            payload: {
                key: this.storageKeys.refreshToken
            }
        });
        this.userCredentials = null;
        await this.msgBus.request({
            channel: "APP-KV-STORE-REMOVE",
            payload: {
                key: this.storageKeys.userCredentials
            }
        });
        this.acl = null;
        await this.msgBus.request({
            channel: "APP-KV-STORE-REMOVE",
            payload: {
                key: this.storageKeys.acl
            }
        });
    }

    async requestAuthorize() {
        this.accessToken = null;
        this.acl = null;

        const signIn = this.msgBus.once({
            channel: "APP-SECURITY-AUTH-SIGNIN",
            group: "out"
        });

        const signOut = async () => {
            await this.msgBus.once({
                channel: "APP-SECURITY-AUTH-SIGNOUT",
                group: "out"
            });
            throw new Error("Auth failed: login aborted");
        };

        this.msgBus.send({
            channel: "APP-SECURITY-REQUEST-AUTH-SIGNIN",
            payload: {
                callbackUrl: window.location.pathname + window.location.search
            }
        });
        await Promise.race([signIn, signOut]);
    }

    async signInAsync(credentials: UserCredentials) {
        let url = this.domainConfig.routes?.authSignIn;

        url = url.replace(/[?&]$/, "");

        const content = JSON.stringify(credentials);

        // application/x-www-form-urlencoded?
        // username=&password=

        const requestParams: IRequestParams = {
            url: url,
            body: content,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/plain"
            }
        };

        const request: IRequestState = {
            ...requestParams,
            status: "executing"
        };

        const response: IResponseState = await this.fetcher.fetch(url, requestParams);
        await getResponseResult(response, request);
        ApiError.assert(response, request);

        let tokens = response.resolved.json as SecurityTokens;

        this.userCredentials = credentials;

        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        // this.acl = ...;

        this.saveDataAsync();

        return this.getContext();
    }

    async saveDataAsync() {
        await this.msgBus.request({
            channel: "APP-KV-STORE-SET",
            payload: {
                key: this.storageKeys.accessToken,
                value: this.accessToken || null
            }
        });
        await this.msgBus.request({
            channel: "APP-KV-STORE-SET",
            payload: {
                key: this.storageKeys.refreshToken,
                value: this.refreshToken || null
            }
        });
        await this.msgBus.request({
            channel: "APP-KV-STORE-SET",
            payload: {
                key: this.storageKeys.userCredentials,
                value: this.userCredentials ? this.userCredentials : null
            }
        });
        await this.msgBus.request({
            channel: "APP-KV-STORE-SET",
            payload: {
                key: this.storageKeys.acl,
                value: this.acl ? this.acl : null
            }
        });
    }

    async signOutAsync() {
        let url = this.domainConfig.routes?.authSignOut;
        if (url) {
            url = url.replace(/[?&]$/, "");
        }

        const requestParams: IRequestParams = {
            url: url,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/plain"
            }
        };

        const request: IRequestState = {
            ...requestParams,
            status: "executing"
        };

        const response: IResponseState = await this.fetcher.fetch(url, requestParams);
        await getResponseResult(response, request);
        ApiError.assert(response, request);

        // this.accessToken = null;
        // this.refreshToken = null;
        // this.userCredentials = null;
        // this.acl = null;
        // this.saveDataAsync();
        this.clearSavedDataAsync();
    }

    async refreshAsync() {
        let url = this.domainConfig.routes?.authRefresh;
        if (url) {
            url = url.replace(/[?&]$/, "");
        }

        let tokens: SecurityTokens = {
            refreshToken: this.refreshToken
        };

        const content = JSON.stringify(tokens);
        // const content = tokens;

        const requestParams: IRequestParams = {
            url: url,
            body: content,
            method: "POST",
            // useAuth: true,
            headers: {
                "Content-Type": "application/json",
                Accept: "text/plain"
            }
        };

        const request: IRequestState = {
            ...requestParams,
            status: "executing"
        };

        const response: IResponseState = await this.fetcher.fetch(url, requestParams);
        await getResponseResult(response, request);
        ApiError.assert(response, request);

        tokens = response.resolved.json as SecurityTokens;

        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        // this.userInfo = ...; // TODO
        // this.acl = ...;

        this.saveDataAsync();

        return this.getContext();
    }

    async getAcl<T extends ISecurable>(obj: T) {
        // TODO: read from this.acl

        return {
            [AccessLevel.Full]: ""
        } as IAccessDescriptor;
    }

    // authorize
    async verifyAccess<T extends ISecurable>(obj: T, accessLevel = AccessLevel.Full) {
        const acl = this.getAcl(obj);

        // TODO: check accessDescriptors

        return false;
    }
}
