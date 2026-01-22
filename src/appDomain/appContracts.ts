import { $C_ERROR, MsgStructBase, MsgStructFactory } from "@actdim/msgmesh/contracts";
import { BaseSecurityDomainConfig as BaseSecurityDomainConfig, BaseSecurityMsgStruct } from "@/appDomain/security/securityContracts";
import { ReactNode } from "react";
import { KeysOf } from "@actdim/utico/typeCore";
import { BaseContext } from "@/componentModel/contracts";
import { StoreItem } from "@actdim/utico/store/storeContracts";

export const $NAV_GOTO = "APP.NAV.GOTO";
export const $NAV_CONTEXT_GET = "APP.NAV.CONTEXT.GET";
export const $NAV_CONTEXT_CHANGED = "APP.NAV.CONTEXT.CHANGED";
export const $NAV_HISTORY_READ = "APP.NAV.HISTORY.READ";

export const $NOTICE = "APP.NOTICE";
export const $CONFIG_GET = "APP.CONFIG.GET";

export const $ERROR = "APP.ERROR";
export const $MSGBUS_ERROR = $C_ERROR;

export const $FETCH = "APP.FETCH";

export const $STORE_GET = "APP.STORE.GET";
export const $STORE_SET = "APP.STORE.SET";
export const $STORE_REMOVE = "APP.STORE.REMOVE";
// TODO: HAS, CLEAR

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

export const $isAppError = Symbol("$isAppError");
export type AppError = {
    type?: string;
    name?: string;
    source?: string;
    // module: string;
    // description
    stack?: string;
    detail?: string;
    timestamp?: string;
    // reason?: string;
    cause?: AppError;
    // traceId?: string;
    message: string;
    // propertyBag/context
    properties?: Record<string | number, any>;
    [$isAppError]: true;
};

// Base(App)ApiMsgStruct
export type BaseApiMsgStruct = BaseSecurityMsgStruct &
    MsgStructFactory<{
        // "GET-VERSION"?: {
        //     in: any;
        // };
    }>;

export type Importance =
    | "critical"
    | "high"
    | "normal"
    | "low"
    | undefined

// Intent
export type Severity =
    // critical/high
    | 'emergency'
    | 'alert' // danger
    | 'error' // failure
    | 'warn' // caution
    // normal
    | 'notice' // notification
    | 'info' // default
    | 'success' // confirmation
    // low
    | 'hint' // note
    | 'debug' // trace
    | undefined;

// BaseAppMsgStruct
export type BaseAppMsgStruct<TNavRoutes extends NavRoutes = NavRoutes> = BaseApiMsgStruct &
    MsgStructFactory<
        {
            [$NOTICE]: {
                in: {
                    text: string;
                    title?: string;
                    detail?: string;
                    severity?: Severity;
                    // propertyBag/context
                    properties?: Record<string | number, any>;
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
            [$NAV_CONTEXT_GET]: {
                in: void;
                out: NavContext;
            };
            [$NAV_CONTEXT_CHANGED]: {
                in: NavContext;
                out: void;
            };
            [$NAV_HISTORY_READ]: {
                in: number;
                out: NavContext;
            };
            [$ERROR]: {
                in: {
                    err: any;
                    properties?: Record<string | number, any>
                };
                out: boolean;
            };
            [$MSGBUS_ERROR]: {
                in: {
                    err: any;
                    properties?: Record<string | number, any>
                };
                out: boolean;
            };
            [$FETCH]: {
                in: {
                    url: string;
                    params: RequestInit;
                };
                out: Response;
            };
            [$STORE_GET]: {
                in: {
                    key: string;
                    useEncryption?: boolean;
                };
                out: StoreItem;
            };
            [$STORE_SET]: {
                in: {
                    key: string;
                    value: any;
                    useEncryption?: boolean;
                };
                out: void;
            };
            [$STORE_REMOVE]: {
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
    TApiConfig extends BaseApiConfig = BaseApiConfig
> = {
    id: string;
    name?: string;
    baseUrl: string;
    security: TSecurityDomainConfig;
    defaultApi?: string;
    apis: Record<string, TApiConfig>;
    // HATEOAS? (React Admin)
};

export type BaseAppMsgChannels<TChannel extends keyof BaseAppMsgStruct | Array<keyof BaseAppMsgStruct>> = KeysOf<BaseAppMsgStruct, TChannel>;

export type BaseAppContext<TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct> = BaseContext<TMsgStruct> & {
    // securityProvider: SecurityProvider;
};