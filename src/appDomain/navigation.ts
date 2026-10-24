import { compile, match, parse } from "path-to-regexp";
import { NavRoute, NavRouteParams } from "./commonContracts";
// createAppRoute
export function createNavigationRoute<TParams extends NavRouteParams = NavRouteParams>(options: {
    pattern: string;
    element: any; // ReactNode for example
    defaultParams?: TParams;
}) {
    const toUrl = getUrlBuilder(options.pattern);
    const matcher = getUrlMatcher(options.pattern);
    return {
        url: (params?: TParams) => {
            if (!params) {
                return options.pattern;
            }
            // path + search + hash
            return toUrl(params);
        },
        match: (url: string) => {
            const matchResult = matcher(url);
            if (matchResult === false) {
                return undefined;
            }
            return matchResult.params;
        },
        element: options.element,
        defaultParams: options.defaultParams
    } as NavRoute<TParams>;
}

export function getUrlBuilder(pattern: string) {
    const [pathTemplate, _] = pattern.split('?');

    const keys = parse(pathTemplate)
        .tokens
        .filter(t => t.type === 'param' || t.type === 'group')
        .map(t => ((t as any).name || (t as any).tokens?.[0]?.value) as string);

    const toPath = compile(pathTemplate);

    return (params?: Record<string, any>) => {
        if (!params) {
            params = {};
        }
        const pathParams: Record<string, any> = {};
        const queryParams: Record<string, any> = {};

        for (const [key, value] of Object.entries(params)) {
            // an absent optional param is omitted, never serialized as "undefined" / "null"
            if (value === undefined || value === null) {
                continue;
            }
            if (keys.includes(key)) {
                pathParams[key] = value;
            } else {
                queryParams[key] = value;
            }
        }

        const path = toPath(pathParams);
        const query = new URLSearchParams(queryParams).toString();

        return query ? `${path}?${query}` : path;
    };
}

/**
 * Absolute URL (leading `/`) of a route for the given params, usable as a link `href` and as `APP.NAV.GOTO` `url`.
 * Route patterns are relative (`explorer`), so a bare `route.url()` would resolve against the current location.
 */
export function toRouteHref<TParams extends NavRouteParams>(route: NavRoute<TParams>, params?: TParams): string {
    const url = route.url(params ?? ({} as TParams));
    return url.startsWith('/') ? url : `/${url}`;
}

/** Mouse event fields read by `isPlainLeftClick` (React and DOM events both fit). */
export type LinkClickEvent = {
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    defaultPrevented: boolean;
};

/**
 * A plain primary click: the app navigates in place. Middle, Ctrl/Cmd, Shift and Alt clicks (new tab, new window,
 * download) and `target` other than `_self` belong to the browser.
 */
export function isPlainLeftClick(e: LinkClickEvent, target?: string): boolean {
    return (
        e.button === 0 &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey &&
        !e.defaultPrevented &&
        (!target || target === '_self')
    );
}

/** An in-app href (`/path`), as opposed to an external, protocol-relative or `mailto:` link. */
export function isAppHref(href: string | undefined | null): href is string {
    return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');
}

export function getUrlMatcher(pattern: string) {
    const [pathTemplate, _] = pattern.split('?')

    const matchFn = match(pathTemplate);

    return (url: string) => {
        const [pathname, search] = url.split('?');

        const result = matchFn(pathname);
        if (!result) return false;

        const query: Record<string, string> = {}
        if (search) {
            new URLSearchParams(search).forEach((value, key) => {
                query[key] = value
            });
        }

        return {
            params: result.params,
            query
        };
    }
}

function trimSlashes(path: string) {
    return path.replace(/^\/+|\/+$/g, '');
}

/**
 * Resolves the callbackUrl for a redirect to the sign-in page. When the current location already is the
 * sign-in page (another request asked for auth meanwhile), its own callbackUrl is kept instead of nesting
 * the sign-in URL into itself; already nested sign-in callbacks are unwrapped.
 */
export function resolveSignInCallbackUrl(
    signInPath: string,
    location: { pathname: string; search: string; hash: string }
): string {
    const signIn = trimSlashes(signInPath);
    let callbackUrl = location.pathname + location.search + location.hash;
    // bounded: a malformed chain must not loop forever
    for (let depth = 0; depth < 16; depth++) {
        const url = new URL(callbackUrl, 'http://callback.local');
        if (trimSlashes(url.pathname) !== signIn) {
            return callbackUrl;
        }
        callbackUrl = url.searchParams.get('callbackUrl') || '/';
    }
    return '/';
}