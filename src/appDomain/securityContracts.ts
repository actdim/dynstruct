import { MsgStruct } from "@actdim/msgmesh/contracts";
import { Skip } from "@actdim/utico/typeCore";
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

export type UserCredentials = {
    // userId/sid (SID is an acronym for "security identity", grant recipient)
    userName?: string;
    email?: string;
    password?: string;
};

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
export const $AUTH_SESSION_GET = "APP.SECURITY.AUTH.SESSION.GET" as const;
export const $AUTH_SESSION_CHANGED = "APP.SECURITY.AUTH.SESSION.CHANGED" as const; // UPDATED?
export const $CONFIG_GET = "APP.SECURITY.CONFIG.GET" as const;
export const $CONFIG_CHANGED = "APP.SECURITY.CONFIG.CHANGED" as const;  // UPDATED?

export type AuthProvider = {
    signIn(email: string, password: string): Promise<AuthSession>;
    signUp(email: string, data: unknown): Promise<AuthSession>;
    signOut?(): Promise<void>;
}

export type SecurityTypeRegistry = {
    "AuthProvider": AuthProvider;
};

// Base(App)SecurityMsgStruct
export type BaseSecurityMsgStruct = MsgStruct<
    {
        [$AUTH_SIGNIN_REQUEST]: {
            in: UserCredentials;
            out: AuthSession;
        };
        [$AUTH_SIGNIN]: {
            in: UserCredentials;
            out: AuthSession;
        };
        [$AUTH_SIGNOUT_REQUEST]: {
            in: { accessToken: string; };
            // out: void;
        };
        [$AUTH_SIGNOUT]: {
            in: { accessToken: string; };
            out: void;
        };
        [$AUTH_REFRESH_REQUEST]: {
            in: { refreshToken: string };
            out: AuthSession;
        };
        [$AUTH_REFRESH]: {
            in: { refreshToken: string };
            out: AuthSession;
        };
        [$AUTH_ENSURE]: {
            in: void;
            // out: void;
        };
        [$AUTH_SESSION_GET]: {
            in: void;
            out: AuthSession;
        };
        [$AUTH_SESSION_CHANGED]: {
            in: AuthSession;
            // out: void;
        };
        [$CONFIG_GET]: {
            in: void;
            out: BaseSecurityDomainConfig;
        };
        [$CONFIG_CHANGED]: {
            in: BaseSecurityDomainConfig;
            // out: void;
        };
    }
>;

// SecuritySession
export type AuthSession = {
    accessToken?: string;
    refreshToken?: string;
    // isAuthenticated?: boolean;
    // isExpired?: boolean;
    // signInInfo
    authInfo?: any;
    // authority?: string;
    authProvider?: string; // authSource
    domain?: string; // protection space, scope of protection
    // authExpiresAt/sessionExpiresAt
    tokenExpiresAt?: string; // for proactive refresh
    // acl?: any;
};
