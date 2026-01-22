import { MsgBus, MsgStruct, MsgStructBase } from "@actdim/msgmesh/contracts";
import { RequireExtends, Skip } from "@actdim/utico/typeCore";
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
    userName: string;
    password: string;
};

export type IAccessDescriptor = {
    // deny/grant reason(s)
    [P in AccessLevel]?: string;
};

export const $AUTH_SIGNIN = "APP.SECURITY.AUTH.SIGNIN" as const;
export const $AUTH_SIGNIN_REQUEST = "APP.SECURITY.AUTH.SIGNIN.REQUEST" as const;
export const $AUTH_SIGNOUT = "APP.SECURITY.AUTH.SIGNOUT" as const;
export const $AUTH_SIGNOUT_REQUEST = "APP.SECURITY.AUTH.SIGNOUT.REQUEST" as const;
export const $AUTH_REFRESH = "APP.SECURITY.AUTH.REFRESH" as const;
// require
export const $AUTH_ENSURE = "APP.SECURITY.AUTH.ENSURE" as const;
export const $ACL_GET = "APP.SECURITY.ACL.GET" as const;
export const $CONTEXT_GET = "APP.SECURITY.CONTEXT.GET" as const;
export const $CONFIG_GET = "APP.SECURITY.CONFIG.GET" as const;

export type SecurityTokens = {
    accessToken?: string;
    refreshToken?: string;
};

// Base(App)SecurityMsgStruct
export type BaseSecurityMsgStruct = RequireExtends<
    {
        [$AUTH_SIGNIN]: {
            in: UserCredentials;
            out: SecurityContext;
        };
        [$AUTH_SIGNIN_REQUEST]: {
            in: {
                callbackUrl: string;
            };
            // out: void;
        };
        [$AUTH_SIGNOUT]: {
            in: void;
            out: void;
        };
        [$AUTH_SIGNOUT_REQUEST]: {
            in: {
                callbackUrl: string;
            };
            // out: void;
        };
        [$AUTH_REFRESH]: {
            in: Skip<SecurityTokens, "accessToken">;
            out: SecurityContext;
        };
        [$AUTH_ENSURE]: {
            in: void;
            out: void;
        };
        [$ACL_GET]: {
            in: ISecurable;
            out: IAccessDescriptor;
        };
        [$CONTEXT_GET]: {
            in: void;
            out: SecurityContext;
        };
        [$CONFIG_GET]: {
            in: void;
            out: BaseSecurityDomainConfig;
        };
    } & MsgStructBase,
    MsgStruct
>;

export type ISecurable = {
    id: string;
};

// AppSecurityContext
export type SecurityContext = {
    // isAuthenticated: boolean;
    // isExpired: boolean;
    accessToken: string;
    refreshToken: string;
    // sessionToken: string;
    // sid: string; // SID is an acronym for "security identity", grant recipient
    // signInInfo
    authInfo?: any;
    // authority: string;
    authProvider: string; // authSource
    domain: string; // protection space, scope of protection
    // authExpiresAt
    tokenExpiresAt: string;
    // acl: any;
};

// Base(App)Security(Domain)Config
export type BaseSecurityDomainConfig = {
    id: string;
    name?: string;
    authType: string;
    // endpoints
    routes: {
        authSignIn: string;
        authSignOut: string;
        authRefresh: string;
        // RFC 8414 (OIDC) — "OAuth 2.0 Authorization Server Metadata"
        // https://datatracker.ietf.org/doc/html/rfc8414        
        authService: string;
    };
};
