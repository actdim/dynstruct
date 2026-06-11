import { MsgStruct } from "@actdim/msgmesh/contracts";
import { BaseSecurityDomainConfig } from "./commonContracts";
// abstract
export enum AccessLevel {
    None = 0,
    Inherited = 1 << 0, // Unset
    NoRender = 1 << 1,
    Hidden = 1 << 2,
    Disabled = 1 << 3,
    ReadOnly = 1 << 4, // View
    Full = ~(~0 << 5) // Unrestricted
}

// export type ISecurable = {
//     id: string;
// };

export type IAccessDescriptor = {
    // deny/grant reason(s)
    [P in AccessLevel]?: string;
};

export const $AUTH_SIGNIN_REQUEST = "APP.SECURITY.AUTH.SIGNIN.REQUEST" as const;
export const $AUTH_SIGNIN = "APP.SECURITY.AUTH.SIGNIN" as const;
export const $AUTH_SIGNOUT_REQUEST = "APP.SECURITY.AUTH.SIGNOUT.REQUEST" as const;
export const $AUTH_SIGNOUT = "APP.SECURITY.AUTH.SIGNOUT" as const;
export const $AUTH_REFRESH_REQUEST = "APP.SECURITY.AUTH.REFRESH.REQUEST" as const;
export const $AUTH_REFRESH = "APP.SECURITY.AUTH.REFRESH" as const;
// require
export const $AUTH_ENSURE = "APP.SECURITY.AUTH.ENSURE" as const;
export const $AUTH_APPLY = "APP.SECURITY.AUTH.APPLY" as const;
export const $AUTH_INFO_GET = "APP.SECURITY.AUTH.INFO.GET" as const;
export const $AUTH_INFO_CHANGED = "APP.SECURITY.AUTH.INFO.CHANGED" as const; // UPDATED?
export const $CONFIG_GET = "APP.SECURITY.CONFIG.GET" as const;
export const $CONFIG_CHANGED = "APP.SECURITY.CONFIG.CHANGED" as const;  // UPDATED?

export type AuthProvider = {
    signIn(email: string, password: string): Promise<AuthInfo>;
    signUp(email: string, data: unknown): Promise<AuthInfo>;
    signOut?(): Promise<void>;
}

export type SecurityTypeRegistry = {
    "AuthProvider": AuthProvider;
};

// Base(App)SecurityMsgStruct
export type BaseSecurityMsgStruct = MsgStruct<
    {
        [$AUTH_SIGNIN_REQUEST]: {
            in: {
                credentials: SignInCredentials,
                auth?: AuthInfo,
            };
            out: AuthInfo;
        };
        [$AUTH_SIGNIN]: {
            in: {
                credentials: SignInCredentials,
                auth?: AuthInfo,
            };
            out: AuthInfo;
        };
        [$AUTH_SIGNOUT_REQUEST]: {
            in: AuthInfo;
        };
        [$AUTH_SIGNOUT]: {
            in: AuthInfo;
        };
        [$AUTH_REFRESH_REQUEST]: {
            in: AuthInfo;
            out: AuthInfo;
        };
        [$AUTH_REFRESH]: {
            in: AuthInfo,
            out: AuthInfo;
        };
        [$AUTH_ENSURE]: {
            in: void;
            out: AuthInfo;
        };
        // ENRICH
        [$AUTH_APPLY]: {
            in: Partial<RequestInit> & {
                url: string;
                headers: Record<string, string>;
            };
            out: {
                query?: Record<string, string>;
                headers?: Record<string, string>;
                credentials?: RequestCredentials;
            };
        };
        [$AUTH_INFO_GET]: {
            in: void;
            out: AuthInfo;
        };
        [$AUTH_INFO_CHANGED]: {
            in: AuthInfo;
        };
        [$CONFIG_GET]: {
            in: void;
            out: BaseSecurityDomainConfig;
        };
        [$CONFIG_CHANGED]: {
            in: BaseSecurityDomainConfig;
        };
    }
>;

export type AuthScheme =
    // IANA registered schemes
    | "Basic"
    | "Bearer"
    | "Digest"
    | "NTLM"
    | "Negotiate"
    | "VAPID"
    // de facto
    | "Session"
    | "ApiKey";

export type BasicSignInCredentials = {
    scheme: "Basic";
    userName: string;
    password: string;
};

export type BearerSignInCredentials = {
    // userId/sid (SID is an acronym for "security identity", grant recipient)
    scheme: "Bearer";
    userName: string;
    password: string;
};

export type DigestSignInCredentials = {
    scheme: "Digest";
    userName: string;
    password: string;
};

export type NtlmSignInCredentials = {
    scheme: "NTLM";
    userName: string;
    password: string;
    domain?: string;
};

export type NegotiateSignInCredentials = {
    scheme: "Negotiate";
    userName: string;
    password: string;
    domain?: string;
};

export type VapidSignInCredentials = {
    scheme: "VAPID";
    privateKey: string;
    subject: string; // mailto: or https: URL
};

export type SessionSignInCredentials = {
    scheme: "Session";
    userName: string;
    password: string;
};

export type ApiKeySignInCredentials = {
    scheme: "ApiKey";
    apiKey: string;
};

export type SignInCredentials =
    | BasicSignInCredentials
    | BearerSignInCredentials
    | DigestSignInCredentials
    | NtlmSignInCredentials
    | NegotiateSignInCredentials
    | VapidSignInCredentials
    | SessionSignInCredentials
    | ApiKeySignInCredentials;

type AuthInfoBase = {
    isAuthenticated?: boolean;
    authority?: string;
    provider?: string;
    accessToken?: string;
    properties?: Record<string, unknown>;
    domain?: string; // protection space, scope of protection
    // acl?: any;
    // RBAC vs ABAC vs PBAC: https://habr.com/ru/companies/otus/articles/698080/
};

export type BasicAuthInfo = AuthInfoBase & {
    scheme: "Basic";
} & BasicSignInCredentials;

export type BearerAuthInfo = AuthInfoBase & {
    scheme: "Bearer";
    refreshToken?: string;
    // isExpired?: boolean;
    tokenExpiresAt?: string; // for proactive refresh
};

export type DigestAuthInfo = AuthInfoBase & {
    scheme: "Digest";
    realm?: string;
    nonce?: string;
    algorithm?: string;
};

export type NtlmAuthInfo = AuthInfoBase & {
    scheme: "NTLM";
    negotiationToken?: string;
};

export type NegotiateAuthInfo = AuthInfoBase & {
    scheme: "Negotiate";
    negotiationToken?: string;
};

export type VapidAuthInfo = AuthInfoBase & {
    scheme: "VAPID";
    publicKey?: string;
    subject?: string; // mailto: or https: URL identifying the sender
};

export type SessionAuthInfo = AuthInfoBase & {
    scheme: "Session";
    sessionId?: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
};

export type ApiKeyAuthInfo = AuthInfoBase & {
    scheme: "ApiKey";
    apiKey?: string;
    keyName?: string;
    keyLocation?: "header" | "query" | "cookie";
};

export type AuthInfo =
    | BasicAuthInfo
    | BearerAuthInfo
    | DigestAuthInfo
    | NtlmAuthInfo
    | NegotiateAuthInfo
    | VapidAuthInfo
    | SessionAuthInfo
    | ApiKeyAuthInfo;
