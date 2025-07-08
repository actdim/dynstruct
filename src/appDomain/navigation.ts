import { compile, match } from "path-to-regexp";
import { NavRoute, NavRouteParams } from "./appContracts";
import { ReactNode } from "react";
// createAppRoute
export function createNavigationRoute<TParams extends NavRouteParams = NavRouteParams>(config: {
    pattern: string;
    element: ReactNode;
    defaultParams?: TParams;
}) {
    const toPath = compile(config.pattern);
    const matcher = match(config.pattern);
    return {
        path: (params?: object) => {
            if (!params) {
                return config.pattern;
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
        element: config.element,
        defaultParams: config.defaultParams
    } as NavRoute<TParams>;
}
