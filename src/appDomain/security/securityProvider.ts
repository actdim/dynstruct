import {
    AccessLevel,
    IAccessDescriptor,
    ISecurable,
    BaseSecurityDomainConfig,
    UserCredentials,
    SecurityTokens,
    SecurityContext,
    $AUTH_SIGNIN,
    $AUTH_SIGNOUT,
    $AUTH_SIGNIN_REQUEST,
    $CONTEXT_GET,
    $ACL_GET,
    $AUTH_REFRESH,
    $AUTH_ENSURE,
    $CONFIG_GET as $SECURITY_CONFIG_GET
} from "./securityContracts";
import { getValuePrefixer } from "@actdim/utico/typeCore";
import { jwtDecode } from "jwt-decode";
import { getResponseResult, IRequestParams, IRequestState, IResponseState } from "@/net/request";
import { ApiError } from "@/net/apiError";
import { MsgBus, MsgSubOptions } from "@actdim/msgmesh/contracts";
import { $CONFIG_GET, $STORE_GET, $STORE_REMOVE, $STORE_SET, BaseAppContext, BaseAppMsgStruct } from "@/appDomain/appContracts";

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
    // signInInfo
    authInfo: "AUTH_INFO"
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

export class SecurityProvider {
    // private isAuthenticated: boolean;

    // private isExpired: boolean;

    private msgBus: MsgBus<BaseAppMsgStruct>;

    private domainConfig: BaseSecurityDomainConfig;

    private storageKeys: typeof storageKeys;

    private accessToken: string;

    private refreshToken: string;

    private userCredentials: UserCredentials;

    private authInfo: any;

    // private authority: string;
    private authProvider: string;

    private tokenExpiresAt: string;

    // RBAC vs ABAC vs PBAC: https://habr.com/ru/companies/otus/articles/698080/
    private acl: any;

    private fetcher: { fetch(url: RequestInfo, init?: RequestInit): Promise<Response> } = window;

    private abortController: AbortController;

    constructor(context: BaseAppContext) {
        this.msgBus = context.msgBus;

        this.abortController = new AbortController();
        const abortSignals = [this.abortController.signal];
        if (context?.abortSignal) {
            abortSignals.push(context.abortSignal);
        }
        const abortSignal = AbortSignal.any(abortSignals);

        // TODO: support custom requests

        const options: MsgSubOptions = {
            abortSignal
        };
        this.msgBus.provide({
            channel: $CONTEXT_GET,
            callback: (msg) => {
                return this.getContext();
            }, options
        });

        this.msgBus.provide({
            channel: $ACL_GET,
            callback: (msg) => {
                return this.getAcl(msg.payload);
            }, options
        });

        this.msgBus.provide({
            channel: $AUTH_SIGNIN,
            callback: (msg) => {
                return this.signIn(msg.payload);
            }, options
        });

        this.msgBus.provide({
            channel: $AUTH_SIGNOUT,
            callback: (msg) => {
                return this.signOut();
            }, options
        });

        this.msgBus.provide({
            channel: $AUTH_REFRESH,
            callback: (msg) => {
                return this.refreshAuth();
            }, options
        });

        this.msgBus.provide({
            channel: $AUTH_ENSURE,
            callback: (msg) => {
                return this.ensureAuth();
            }, options
        });

        // + $CONFIG_SET/$CONFIG_UPDATE?

        this.msgBus.provide({
            channel: $SECURITY_CONFIG_GET,
            callback: async (msg) => {
                // return this.domainConfig;
                return (
                    await this.msgBus.request({
                        channel: $CONFIG_GET
                    })
                ).payload?.security;
            }, options
        });
    }

    [Symbol.dispose]() {
        this.abortController.abort();
    }

    protected async init() {
        if (!this.domainConfig) {
            await this.updateConfig();
        }
    }

    public async getContext(): Promise<SecurityContext> {
        await this.init();
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            authInfo: this.authInfo,
            authProvider: this.authProvider,
            domain: this.domain,
            tokenExpiresAt: this.tokenExpiresAt
        };
    }

    private async updateConfig() {
        const msg = await this.msgBus.request({
            channel: $CONFIG_GET
        });
        this.domainConfig = msg.payload.security;
        const prefixer = getValuePrefixer<typeof storageKeys>(`${this.domainConfig?.id}/`);
        this.storageKeys = prefixer(storageKeys);
        await this.restoreData();
    }

    async restoreData() {
        let msg = await this.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: this.storageKeys.accessToken
            }
        });
        this.accessToken = msg.payload.data?.value;

        msg = await this.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: this.storageKeys.refreshToken
            }
        });
        this.refreshToken = msg.payload.data?.value;

        msg = await this.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: this.storageKeys.userCredentials
            }
        });
        this.userCredentials = msg.payload.data?.value || {
            userName: null,
            password: null
        };

        msg = await this.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: this.storageKeys.authInfo
            }
        });

        this.authInfo = msg.payload.data?.value;

        msg = await this.msgBus.request({
            channel: $STORE_GET,
            payload: {
                key: this.storageKeys.acl
            }
        })
        this.acl = msg.payload.data?.value || null;

        if (this.accessToken) {
            const context = await this.getContext();
            this.msgBus.send({
                channel: $AUTH_SIGNIN,
                group: "out",
                payload: context
            });
        }
    }

    public get domain(): string {
        return this.domainConfig?.id;
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
    async clearSavedData() {
        this.accessToken = null;
        await this.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: this.storageKeys.accessToken
            }
        });
        this.refreshToken = null;
        await this.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: this.storageKeys.refreshToken
            }
        });
        this.userCredentials = null;
        await this.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: this.storageKeys.userCredentials
            }
        });
        this.authInfo = null;
        await this.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: this.storageKeys.authInfo
            }
        });
        this.acl = null;
        await this.msgBus.request({
            channel: $STORE_REMOVE,
            payload: {
                key: this.storageKeys.acl
            }
        });
    }

    public async ensureAuth() {

        // await this.init();

        this.accessToken = null;
        this.acl = null;

        const signIn = this.msgBus.once({
            channel: $AUTH_SIGNIN,
            group: "out"
        });

        const signOut = async () => {
            await this.msgBus.once({
                channel: $AUTH_SIGNOUT,
                group: "out"
            });
            throw new Error("Auth failed: login aborted");
        };

        this.msgBus.send({
            channel: $AUTH_SIGNIN_REQUEST,
            payload: {
                callbackUrl: window.location.pathname + window.location.search
            }
        });

        await Promise.race([signIn, signOut]);
    }

    public async signIn(credentials: UserCredentials) {
        await this.init();

        let url = this.domainConfig.routes?.authSignIn;

        url = url.replace(/[?&]$/, "");

        const content = JSON.stringify(credentials);

        // TODO:
        // application/x-www-form-urlencoded?
        // ?userName=&password=
        // userName:password (BASIC)

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

        this.authInfo = response.resolved.json;
        const tokens = this.authInfo as SecurityTokens;

        this.userCredentials = credentials;

        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        // this.acl = ...;

        this.saveData();

        return this.getContext();
    }

    async saveData() {
        await this.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: this.storageKeys.accessToken,
                value: this.accessToken || null
            }
        });
        await this.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: this.storageKeys.refreshToken,
                value: this.refreshToken || null
            }
        });
        await this.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: this.storageKeys.userCredentials,
                value: this.userCredentials ? this.userCredentials : null
            }
        });
        await this.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: this.storageKeys.authInfo,
                value: this.authInfo ? this.authInfo : null
            }
        });
        await this.msgBus.request({
            channel: $STORE_SET,
            payload: {
                key: this.storageKeys.acl,
                value: this.acl ? this.acl : null
            }
        });
    }

    public async signOut() {
        await this.init();

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
        // this.saveData();
        this.clearSavedData();
    }

    public async refreshAuth() {
        await this.init();

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

        this.saveData();

        return this.getContext();
    }

    public async getAcl<T extends ISecurable>(obj: T) {
        // TODO: read from this.acl

        await this.init();
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
