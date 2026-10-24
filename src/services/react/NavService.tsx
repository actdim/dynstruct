import {
    To,
    useLocation,
    useNavigate,
    useNavigationType,
    useParams,
    useSearchParams,
} from 'react-router-dom';
import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { NavContext, NavRoutes } from '@/appDomain/commonContracts';
import { getUrlBuilder, toRouteHref } from '@/appDomain/navigation';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: PropsWithChildren & {
            history: NavContext[];
            routes: NavRoutes;
        };
        msgScope: {
            provide: BaseAppMsgChannels<
                | 'APP.NAV.GOTO'
                | 'APP.NAV.CONTEXT.GET'
                | 'APP.NAV.HISTORY.READ'
                | 'APP.NAV.CONTEXT.CHANGED'
            >;
        };
    }
>;

// const store = new PersistentStore('history');

const MAX_HISTORY = 100;

export const useNavService = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    // def closures are created once: they must call the live navigate, not the first-render one
    const liveNavigate = useNavigate();
    const navigateRef = useRef(liveNavigate);
    navigateRef.current = liveNavigate;

    const location = useLocation();
    const navType = useNavigationType();
    const navParams = useParams();
    const [searchParams] = useSearchParams();

    const def: ComponentDef<Struct> = {
        props: {
            history: [],
            routes: undefined,
        },
        msgBroker: {
            provide: {
                'APP.NAV.GOTO': {
                    in: {
                        callback: async (msg) => {
                            const navigate = navigateRef.current;
                            const options = { replace: Boolean(msg.payload?.replace), state: msg.payload?.state };
                            if (typeof msg.payload.path === 'number') {
                                await navigate(msg.payload.path);
                            } else if (msg.payload.url) {
                                await navigate(msg.payload.url, options);
                            } else if (typeof msg.payload.path === 'string') {
                                const toUrl = getUrlBuilder(msg.payload.path);
                                await navigate(toUrl(msg.payload.params), options);
                            }
                        },
                    },
                    ex: {
                        callback: async (msg) => {
                            const route = msg.payload.route;
                            const options = { replace: Boolean(msg.payload?.replace), state: msg.payload?.state };
                            await navigateRef.current(toRouteHref(m.routes[route], msg.payload.params), options);
                        },
                    },
                },
                'APP.NAV.CONTEXT.GET': {
                    in: {
                        callback: (msg) => {
                            return m.history[m.history.length - 1];
                        },
                    },
                },
                'APP.NAV.HISTORY.READ': {
                    in: {
                        callback: (msg) => {
                            let shift = msg.payload ? msg.payload : -1;
                            if (shift > 0) {
                                shift *= -1;
                            }
                            return m.history[m.history.length + shift];
                        },
                    },
                },
                'APP.NAV.CONTEXT.CHANGED': {},
            },
        },
        view: () => {
            return null;
        },
    };

    c = useComponent(def, params);
    m = c.model;

    // Publish every location change (push, replace, pop) with the live location. Runs after the component's
    // layout effects (bus wired); the key guard keeps StrictMode double effects to one publish per change.
    useEffect(() => {
        const history = m.history;
        if (history[history.length - 1]?.location?.key === location.key) {
            return;
        }
        const ctx = {
            location: location,
            searchParams: searchParams,
            params: navParams,
            navType: navType,
        };
        history.push(ctx);
        if (history.length > MAX_HISTORY) {
            history.splice(0, history.length - MAX_HISTORY);
        }
        c.msgBus.send({
            channel: 'APP.NAV.CONTEXT.CHANGED',
            group: 'in',
            payload: ctx,
        });
    }, [location.key]);

    return c;
};

export type NavServiceStruct = Struct;
export const NavService: React.FC<ComponentParams<Struct>> = toReact(useNavService);
