import { $CG_ERROR, MsgBus, MsgStruct, MsgStructBase, MsgStructFactory } from "@actdim/msgmesh/msgBusCore";
import { BaseSecurityDomainConfig as BaseSecurityDomainConfig, BaseSecurityMsgStruct } from "@/appDomain/security/securityContracts";
import { ReactNode } from "react";
import { KeysOf } from "@actdim/utico/typeCore";
import { ComponentRegistryContext } from "@/componentModel/contracts";
import { useComponentContext } from "@/componentModel/componentContext";

export const $NAV_GOTO = "APP-NAV-GOTO";
export const $NAV_GET_CONTEXT = "APP-NAV-GET-CONTEXT";
export const $NAV_CONTEXT_CHANGED = "APP-NAV-CONTEXT-CHANGED";
export const $NAV_READ_HISTORY = "APP-NAV-READ-HISTORY";
// TOAST
export const $NOTICE = "APP-NOTICE";
export const $CONFIG_GET = "APP-CONFIG-GET";
// ERROR?
export const $FETCH = "APP-FETCH";

export const $KV_STORE_GET = "APP-KV-STORE-GET";
export const $KV_STORE_SET = "APP-KV-STORE-SET";
export const $KV_STORE_REMOVE = "APP-KV-STORE-REMOVE";
// TODO: has, clear, entries

export type Module = "security" | "api-client";

export type NavPath = {
    /**
     * A URL pathname, beginning with a /.
     */
    pathname: string;
    /**
     * A URL search string, beginning with a ?.
     */
    search: string;
    /**
     * A URL fragment identifier, beginning with a #.
     */
    hash: string;
};

export type NavLocation<State = any> = NavPath & {
    /**
     * A value of arbitrary data associated with this location.
     */
    state: State;
    /**
     * A unique string associated with this location. May be used to safely store
     * and retrieve data in some other storage API, like `localStorage`.
     *
     * Note: This value is always "default" on the initial location.
     */
    key: string;
};

export type NavAction =
    /**
     * A POP indicates a change to an arbitrary index in the history stack, such
     * as a back or forward navigation. It does not describe the direction of the
     * navigation, only that the current index changed.
     *
     * Note: This is the default action for newly created history objects.
     */
    | "POP"
    /**
     * A PUSH indicates a new entry being added to the history stack, such as when
     * a link is clicked and a new page loads. When this happens, all subsequent
     * entries in the stack are lost.
     */
    | "PUSH"
    /**
     * A REPLACE indicates the entry at the current index in the history stack
     * being replaced by a new one.
     */
    | "REPLACE";

// AppRouteParams
export type NavRouteParams = Record<string, string | undefined>;

// AppRoute
export type NavRoute<TParams extends NavRouteParams = NavRouteParams> = {
    path(params?: TParams): string;
    match(path: string): TParams;
    element: ReactNode;
    defaultParams?: TParams;
};

export type NavRoutes = Record<string, NavRoute>;

type NavRouteStruct<TNavRoutes extends NavRoutes> = {
    [K in keyof TNavRoutes]: {
        route: K;
        params?: TNavRoutes[K]["defaultParams"];
    };
}[keyof TNavRoutes];

export type NavContext = {
    // route?: NavRoute;
    location?: NavLocation;
    searchParams?: URLSearchParams;
    params?: NavRouteParams;
    navType?: NavAction;
};

export type NavHistory = Array<NavContext>;

// OperationContext?
export type AppError<TModule = Module> = {
    module: TModule;
    // code: string;
    type: string;
    title?: string;
    source?: any;
    details?: any;
    // instance?: string;
    timestamp?: string;
    // errors: AppError[];
    traceId?: string;
    field?: string;
    reason?: string;
};

// Base(App)ApiMsgStruct
export type BaseApiMsgStruct = BaseSecurityMsgStruct &
    MsgStructFactory<{
        // "GET-VERSION"?: {
        //     in: any;
        // };
    }>;

// BaseAppMsgStruct
export type BaseAppMsgStruct<TNavRoutes extends NavRoutes = NavRoutes> = BaseApiMsgStruct &
    MsgStructFactory<
        {
            [$NOTICE]: {
                in: {
                    text: string;
                    title?: string;
                    type: any;
                };
                out: void;
            };
            [$CONFIG_GET]: {
                in: void;
                out: BaseAppDomainConfig;
            };
            [$NAV_GOTO]: {
                in: string | number;
                ex: NavRouteStruct<TNavRoutes>;
                out: void;
            };
            [$NAV_GET_CONTEXT]: {
                in: void;
                out: NavContext;
            };
            [$NAV_CONTEXT_CHANGED]: {
                in: NavContext;
                out: void;
            };
            [$NAV_READ_HISTORY]: {
                in: number;
                out: NavContext;
            };
            [$FETCH]: {
                in: {
                    url: string;
                    params: RequestInit;
                };
                out: Response;
            };
            [$KV_STORE_GET]: {
                in: {
                    key: string;
                    useEncryption?: boolean;
                };
                out: string;
            };
            [$KV_STORE_SET]: {
                in: {
                    key: string;
                    value: any;
                    useEncryption?: boolean;
                };
                out: void;
            };
            [$KV_STORE_REMOVE]: {
                in: {
                    key: string;
                };
                out: void;
            };
        } & MsgStructBase
    >;

export type BaseApiConfig = {
    url?: string;
    versions?: string[];
};

// BaseApp(Domain)Config
export type BaseAppDomainConfig<
    TSecurityDomainConfig extends BaseSecurityDomainConfig = BaseSecurityDomainConfig,
    TApiConfig extends BaseApiConfig = BaseApiConfig,
    TApiName extends PropertyKey = string
// TApiName extends keyof any = string
> = {
    id: string;
    name?: string;
    baseUrl: string;
    security: TSecurityDomainConfig;
    apis: Record<TApiName, TApiConfig>;
    // HATEOAS? (React Admin)
};

export type BaseAppMsgChannels<TChannel extends keyof BaseAppMsgStruct | Array<keyof BaseAppMsgStruct>> = KeysOf<BaseAppMsgStruct, TChannel>;

export type BaseAppContext<TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct> = ComponentRegistryContext<TMsgStruct> & {
    // securityProvider: SecurityProvider;
};

export const useBaseAppContext = <TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct>() => useComponentContext() as BaseAppContext<TMsgStruct>;