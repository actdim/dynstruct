import { MsgBus, MsgBusStruct, MsgBusStructBase } from "@actdim/msgmesh/msgBusCore";
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

// HTTP RFC 7231
export type UserCredentials = {
    username: string;
    password: string;
};

export type IAccessDescriptor = {
    // deny/grant reason(s)
    [P in AccessLevel]?: string;
};

export const $SIGNIN = "APP-SECURITY-AUTH-SIGNIN";
export const $REQUEST_SIGNIN = "APP-SECURITY-REQUEST-AUTH-SIGNIN";
export const $SIGNOUT = "APP-SECURITY-AUTH-SIGNOUT";
export const $REQUEST_SIGNOUT = "APP-SECURITY-REQUEST-AUTH-SIGNOUT";
export const $REFRESH = "APP-SECURITY-AUTH-REFRESH";
export const $REQUEST_AUTH = "APP-SECURITY-REQUEST-AUTH";
export const $GET_ACL = "APP-SECURITY-GET-ACL";
export const $GET_CONTEXT = "APP-SECURITY-GET-CONTEXT";
export const $GET_CONFIG = "APP-SECURITY-GET-CONFIG";

export type SecurityTokens = {
    accessToken?: string;
    refreshToken?: string;
};

// Base(App)Security(Msg)BusStruct
export type BaseSecurityBusStruct = RequireExtends<
    {
        [$SIGNIN]: {
            in: UserCredentials;
            out: SecurityContext;
        };
        [$REQUEST_SIGNIN]: {
            in: {
                callbackUrl: string;
            };
            // out: void;
        };
        [$SIGNOUT]: {
            in: void;
            out: void;
        };
        [$REQUEST_SIGNOUT]: {
            in: {
                callbackUrl: string;
            };
            // out: void;
        };
        [$REFRESH]: {
            in: Skip<SecurityTokens, "accessToken">;
            out: SecurityContext;
        };
        [$REQUEST_AUTH]: {
            in: void;
            out: void;
        };
        [$GET_ACL]: {
            in: ISecurable;
            out: IAccessDescriptor;
        };
        [$GET_CONTEXT]: {
            in: void;
            out: SecurityContext;
        };
        [$GET_CONFIG]: {
            in: void;
            out: BaseSecurityDomainConfig;
        };        
    } & MsgBusStructBase,
    MsgBusStruct
>;

export type ISecurable = {
    id: string;
};

// AppSecurityContext
export type SecurityContext<TUserInfo = any> = {
    // isAuthenticated: boolean;
    // isExpired: boolean;
    accessToken: string;
    refreshToken: string;
    // sessionToken: string;
    // sid: string; // SID is an acronym for "security identity", grant recipient
    userInfo: TUserInfo;
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
