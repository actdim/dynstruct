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
        .filter(t => t.type === 'group')
        .map(t => (t as any).tokens[0].value as string);

    const toPath = compile(pathTemplate);

    return (params: Record<string, any>) => {
        const pathParams: Record<string, any> = {};
        const queryParams: Record<string, any> = {};

        for (const [key, value] of Object.entries(params)) {
            if (keys.includes(key)) {
                pathParams[key] = value;
            } else {
                queryParams[key] = value;
            }
        }

        const path = toPath(pathParams);
        const query = new URLSearchParams(queryParams).toString();

        return query ? `${path}?${query}` : path;
    }
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