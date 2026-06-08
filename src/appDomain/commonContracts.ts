import { $C_ERROR, ErrorPayload, MsgStruct } from "@actdim/msgmesh/contracts";
import { KeysOf } from "@actdim/utico/typeCore";
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
    url(params?: TParams): string;
    match(path: string): TParams;
    element: any; // ReactNode for example
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

/**  
 * Based on syslog (RFC 5424), journald, OpenTelemetry 
 */
export type EventSeverity =
    // low importance
    // trace, verbose
    | "debug" // 7
    | "info"
    // normal
    | "notice"
    | "warning"
    | "error"
    // high/critical
    // fatal
    | "critical"
    | "alert"
    | "emergency"; // 0

/**
 * High-level categorization of events.
 *
 * This is NOT severity. It describes the domain or subsystem
 * that produced the log event, which is used for filtering,
 * routing, dashboards, and observability grouping.
 */
export type EventCategory =
    /**
     * Runtime, infrastructure, and system-level events.
     * Examples: startup, shutdown, crashes, health checks, resource exhaustion.
     */
    | "system"

    /**
     * General application business logic and feature execution events.
     * Examples: service flows, feature processing, internal state changes.
     */
    | "application"

    /**
     * Security-related events.
     * Examples: authentication failures, suspicious activity, permission denials,
     * login attempts, token validation, idenitity issues, session creation/expiry, potential attacks.
     */
    | "security"

    /**
     * Audit trail events for compliance and traceability.
     * Examples: user configuration changes, admin actions, sensitive operations.
     */
    | "audit"

    /**
     * Performance and latency-related events.
     * Examples: slow requests, high latency operations, cache performance issues.
     */
    | "performance"

    /**
     * Network and communication layer events.
     * Examples: HTTP failures, timeouts, retries, upstream service errors.
     */
    | "network"

    /**
     * Database and persistence layer events.
     * Examples: query failures, slow queries, connection pool exhaustion,
     * migrations, replication issues.
     */
    | "database"

    /**
     * Business domain events.
     * Examples: payments, orders, subscriptions, billing, domain-specific workflows.
     */
    | "business";

/** Where the message belongs in the UI. */
export type AppMsgScope =
    /** The message belongs to a single input field. */
    | "field"

    /** The message belongs to one component, widget, card, or control. */
    | "component"

    /** The message belongs to a larger part of the page, such as a table or panel. */
    | "section"

    /** The message affects the current page or route. */
    | "page"

    /** The message affects the whole application. */
    | "app"

    /** The message comes from background work without a stable visible owner. */
    | "background";

/** What kind of problem or event produced the message. */
export type AppMsgCategory =
    /** Input or submitted data is invalid. */
    | "validation"

    /** Network connection failed, is offline, or is unstable. */
    | "network"

    /** The user is not authenticated or the session expired. */
    | "auth"

    /** The user is authenticated but is not allowed to perform the action. */
    | "permission"

    /** The action conflicts with current server state or another user's changes. */
    | "conflict"

    /** The operation took too long and timed out. */
    | "timeout"

    /** The server failed while processing the request. */
    | "server"

    /** The client app failed before or while handling the operation. */
    | "client"

    /** Required settings, environment, provider, or integration config is missing or invalid. */
    | "misconfiguration"

    /** The cause is not known or does not fit a more specific category. */
    | "unknown";

/** Preferred way to present the message. */
export type AppMsgPresentation =
    /** Show near the UI element that owns the message. */
    | "inline"

    /** Show as a temporary notification. */
    | "toast"

    /** Show as a persistent message at the top of a section, page, or app. */
    | "banner"

    /** Show in a blocking dialog when the user must notice or decide. */
    | "modal"

    /** Do not show to the user, but keep it in state/history if needed. */
    | "silent";

/** What the user can do next. */
export type AppUserAction =
    /** No action is available or required. */
    | "none"

    /** Try the failed operation again. */
    | "retry"

    /** Ask the user to sign in again. */
    | "login"

    /** Reload data or refresh the current page. */
    | "refresh"

    /** Open settings or configuration required to fix the issue. */
    | "openSettings"

    /** Let the user correct invalid input. */
    | "fixInput"

    /** Let the user inspect and resolve conflicting changes. */
    | "reviewChanges"

    /** Let the user replace remote state with their local changes. */
    | "overwrite"

    /** Ask the user to contact support or an administrator. */
    | "contactSupport"

    /** Let the user dismiss the message. */
    | "dismiss";

/**
 * Semantic UI intent used to express the meaning, emphasis,
 * or emotional tone of a UI element (not application state or logging severity).
 *
 * This is typically used for components like buttons, badges, alerts,
 * banners, and notifications to drive consistent styling and accessibility semantics.
 */
export type Intent =
    /**
     * Primary action or main emphasis.
     * Used for the most important call-to-action in a UI context.
     * Example: submit, confirm, save.
     */
    | "primary"

    /**
     * Secondary or alternative action with lower emphasis than primary.
     * Example: cancel, back, optional action.
     */
    | "secondary"

    /**
     * Successful or positive outcome state.
     * Example: saved successfully, operation completed, validation passed.
     */
    | "success"

    /**
     * Informational or neutral contextual message.
     * Example: tips, guidance, system information, non-critical notices.
     */
    | "info"

    /**
     * Warning state indicating a potential issue or risk.
     * Action may still proceed, but user attention is required.
     * Example: deprecated feature, risky action confirmation.
     */
    | "warning"

    /**
     * Dangerous or destructive intent.
     * Used for irreversible or high-impact actions.
     * Example: delete account, remove data, critical destructive actions.
     */
    | "danger"

    /**
     * Neutral or default styling with no special emphasis.
     * Used for passive UI elements or baseline states.
     */
    | "neutral";

export type Variant =
    | "solid"
    | "ghost"
    | "outline";

export type Sentiment =
    | "positive"
    | "neutral"
    | "negative";

export type ActionStatus =
    | "idle"
    | "loading"
    | "success"
    | "error"
    | "warning";

export type ActionRisk =
    // read-only, navigation
    | "safe"    
    // low: trivial mutation (toggle UI setting)
    // medium: data change (edit/save)
    // high: sensitive mutation (permissions, billing)
    | "mutating" // write, sensitive
    // irreversible (delete account)
    | "destructive";

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
            // based on HTTP Problem Details RFC 7807 
            in: {
                /** Main user-facing message text. */
                text: string;
                /** Short human-readable title. */
                title?: string;
                detail?: string;
                severity?: EventSeverity;
                presentation?: AppMsgPresentation;
                userAction?: AppUserAction;
                category?: AppMsgCategory;
                scope?: AppMsgScope;
                source?: string;
                // context
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

// Base(App)Security(Domain)Config
export type BaseSecurityDomainConfig = {
    id: string;
    name?: string;
    authType?: string;
    endpoints: {
        authSignIn: string;
        authSignOut: string;
        authRefresh?: string;
        // RFC 8414 (OIDC) — "OAuth 2.0 Authorization Server Metadata"
        // https://datatracker.ietf.org/doc/html/rfc8414
        authService?: string;
    },
    routes: {
        authSignInPage: string;
        authSignOutPage: string;
    };
};

// BaseApp(Domain)Options
export type BaseAppDomainConfig<
    TApiConfig extends BaseApiConfig = BaseApiConfig,
    TSecurityConfig extends BaseSecurityDomainConfig = BaseSecurityDomainConfig
> = {
    id: string;
    name?: string;
    baseUrl?: string;
    security: TSecurityConfig;
    defaultApi?: string;
    apis?: Record<string, TApiConfig>;
    // HATEOAS? (React Admin)
};

export type CommonAppMsgChannels<TChannel extends keyof CommonAppMsgStruct | Array<keyof CommonAppMsgStruct>> = KeysOf<CommonAppMsgStruct, TChannel>;