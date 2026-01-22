import { compile, match } from "path-to-regexp";
import { NavRoute, NavRouteParams } from "./appContracts";
import { ReactNode } from "react";
// createAppRoute
export function createNavigationRoute<TParams extends NavRouteParams = NavRouteParams>(options: {
    pattern: string;
    element: ReactNode;
    defaultParams?: TParams;
}) {
    const toPath = compile(options.pattern);
    const matcher = match(options.pattern);
    return {
        path: (params?: object) => {
            if (!params) {
                return options.pattern;
            }
            return toPath(params);
        },
        match: (path: string) => {
            const matchResult = matcher(path);
            if (matchResult === false) {
                return undefined;
            }
            return matchResult.params;
        },
        element: options.element,
        defaultParams: options.defaultParams
    } as NavRoute<TParams>;
}
