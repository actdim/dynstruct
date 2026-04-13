import { $C_ERROR, ErrorPayload, MsgStruct } from "@actdim/msgmesh/contracts";
import { ReactNode } from "react";
import { KeysOf } from "@actdim/utico/typeCore";
import { BaseContext } from "@/componentModel/contracts";
import { StoreItem } from "@actdim/utico/store/storeContracts";
import { TypeRegistry } from "@/di/diContracts";

export const $NAV_GOTO = "APP.NAV.GOTO";
export const $NAV_CONTEXT_GET = "APP.NAV.CONTEXT.GET";
export const $NAV_CONTEXT_CHANGED = "APP.NAV.CONTEXT.CHANGED"; // UPDATED?
export const $NAV_HISTORY_READ = "APP.NAV.HISTORY.READ";
export const $NAV_HISTORY_BACK = "APP.NAV.HISTORY.BACK";
export const $NAV_HISTORY_FORWARD = "APP.NAV.HISTORY.FORWARD";

export const $NOTICE = "APP.NOTICE";
export const $CONFIG_GET = "APP.CONFIG.GET";
export const $CONFIG_SET = "APP.CONFIG.SET";
export const $CONFIG_CHANGED = "APP.CONFIG.CHANGED";

export const $ERROR = "APP.ERROR";
export const $MSGBUS_ERROR = $C_ERROR;

export const $FETCH = "APP.FETCH";

export const $STORE_GET = "APP.STORE.GET";
export const $STORE_SET = "APP.STORE.SET";
export const $STORE_REMOVE = "APP.STORE.REMOVE";
// TODO: HAS, CLEAR

export const $CONTAINER_REGISTER = "APP.CONTAINER.REGISTER";
export const $CONTAINER_RESOLVE = "APP.CONTAINER.RESOLVE";

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

export const $isAppError = Symbol("isAppError"); // brand
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

// TypeRegistryChannel
export type ContainerBuilderChannel<TTypeRegistry extends TypeRegistry<any> = TypeRegistry<any>, TKey extends keyof TTypeRegistry = keyof TTypeRegistry> = {
    in: {
        id: TKey,
        factory: (params?: any) => TTypeRegistry[TKey];
    }
    out: void;
}

export type TypeResolverChannel<TTypeRegistry extends TypeRegistry<any> = TypeRegistry<any>, TKey extends keyof TTypeRegistry = keyof TTypeRegistry> = {
    in: TKey;
    out: (params: any) => TTypeRegistry[TKey];
}

export type CommonAppMsgStruct<TNavRoutes extends NavRoutes = NavRoutes, TTypeRegistry extends TypeRegistry<any> = TypeRegistry<any>> = MsgStruct<
    {
        // "APP.VERSION.GET": {
        //     in: void;
        // };
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
        [$CONFIG_SET]: {
            in: BaseAppDomainConfig;
            out: void;
        };
        [$CONFIG_CHANGED]: {
            in: BaseAppDomainConfig;
            out: void;
        };
        [$NAV_GOTO]: {
            in: {
                path: string | number;
                params: any; // NavRouteParams
            };
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
            in: ErrorPayload & {
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

        [$CONTAINER_REGISTER]: ContainerBuilderChannel<TTypeRegistry>;
        [$CONTAINER_RESOLVE]: TypeResolverChannel<TTypeRegistry>;
    } // & SystemMsgStruct
>;

export type BaseApiConfig = {
    url?: string;
    versions?: string[];
};

// BaseApp(Domain)Options
export type BaseAppDomainConfig<
    TApiConfig extends BaseApiConfig = BaseApiConfig,
    TSecurityDomainConfig = any
> = {
    id: string;
    name?: string;
    baseUrl: string;
    security: TSecurityDomainConfig;
    defaultApi?: string;
    apis: Record<string, TApiConfig>;
    // HATEOAS? (React Admin)
};

export type CommonAppMsgChannels<TChannel extends keyof CommonAppMsgStruct | Array<keyof CommonAppMsgStruct>> = KeysOf<CommonAppMsgStruct, TChannel>;

export type CommonAppContext<TMsgStruct extends CommonAppMsgStruct = CommonAppMsgStruct> = BaseContext<TMsgStruct>;