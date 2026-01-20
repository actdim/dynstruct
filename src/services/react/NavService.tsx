import {
    To,
    useLocation,
    useNavigate,
    useNavigationType,
    useParams,
    useSearchParams,
} from 'react-router-dom';
import {
    BaseAppMsgChannels,
    BaseAppMsgStruct,
    NavContext,
    NavRoutes,
} from '@/appDomain/appContracts';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { getFC, useComponent } from '@/componentModel/react';
import { PropsWithChildren } from 'react';

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

export const useNavService = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const navigate = useNavigate();

    const location = useLocation();
    const navType = useNavigationType();
    const nvaParams = useParams();
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
                            navigate(msg.payload as To);
                        },
                    },
                    ex: {
                        callback: async (msg) => {
                            const route = msg.payload.route;
                            navigate(m.routes[route].path(msg.payload.params));
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
                            return m.history[m.history.length - 1];
                        },
                    },
                },
                'APP.NAV.CONTEXT.CHANGED': {},
            },
        },
        events: {
            onLayout: (c) => {
                const history = m.history;
                if (history) {
                    const ctx = {
                        location: location,
                        searchParams: searchParams,
                        params: nvaParams,
                        navType: navType,
                    };
                    history.push(ctx);
                    c.msgBus.send({
                        channel: 'APP.NAV.CONTEXT.CHANGED',
                        group: 'in',
                        payload: ctx,
                    });
                }
            },
        },
        view: () => {
            return null;
        },
    };

    c = useComponent(def, params);
    m = c.model;

    // deps
    // location, navType, params, searchParams

    return c;
};

export type NavServiceStruct = Struct;
export const NavService = getFC(useNavService);
