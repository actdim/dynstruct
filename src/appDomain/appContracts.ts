import { $CG_ERROR, MsgBus, MsgBusStructBase, MsgBusStructFactory } from "@actdim/msgmesh/msgBusCore";
import { BaseSecurityDomainConfig as BaseSecurityDomainConfig, BaseSecurityBusStruct } from "@/appDomain/security/securityContracts";
import { ReactNode } from "react";

export const $NAV_GOTO = "APP-NAV-GOTO";
export const $NAV_GET_CONTEXT = "APP-NAV-CONTEXT";
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

// Base(App)Api(Msg)BusStruct
export type BaseApiBusStruct = BaseSecurityBusStruct &
    MsgBusStructFactory<{
        // "GET-VERSION"?: {
        //     in: any;
        // };
    }>;

// BaseAppMsgBusStruct
export type BaseAppBusStruct = BaseApiBusStruct &
    MsgBusStructFactory<
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
                out: void;
            };
            [$NAV_GET_CONTEXT]: {
                in: void;
                out: NavContext;
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
        } & MsgBusStructBase
    >;

export type BaseApiConfig = {
    url?: string;
    versions?: string[];
};

// BaseApp(Domain)Config
export type BaseAppDomainConfig<
    TSecurityDomainConfig extends BaseSecurityDomainConfig = BaseSecurityDomainConfig,
    TApiConfig extends BaseApiConfig = BaseApiConfig
> = {
    id: string;
    name?: string;
    baseUrl: string;
    security: TSecurityDomainConfig;
    apis: Record<string, TApiConfig>;
    // HATEOAS? (React Admin)
};

export type BaseAppContext<TMsgBusStruct extends BaseAppBusStruct = BaseAppBusStruct> = {
    msgBus: MsgBus<TMsgBusStruct>;
};
