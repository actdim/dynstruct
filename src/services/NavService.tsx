import {
    ComponentParams,
    ComponentStruct,
    getFC,
    useComponent,
    Component,
} from '@actdim/dynstruct/componentModel/componentModel';
import {
    To,
    useLocation,
    useNavigate,
    useNavigationType,
    useParams,
    useSearchParams,
} from 'react-router-dom';
import { NavContext } from '@actdim/dynstruct/appDomain/appContracts';
import { PersistentStore } from '@actdim/utico/store/persistentStore';
import {
    BaseAppBusChannels,
    BaseAppMsgStruct,
    NavRoutes,    
} from '@/appDomain/appContracts';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: {
            history: NavContext[];
            routes: NavRoutes;
        };
        msgScope: {
            provide: BaseAppBusChannels<
                | 'APP-NAV-GOTO'
                | 'APP-NAV-GET-CONTEXT'
                | 'APP-NAV-READ-HISTORY'
                | 'APP-NAV-CONTEXT-CHANGED'
            >;
        };
    }
>;

const store = new PersistentStore('history');

export const useNavService = (params: ComponentParams<Struct>) => {
    const navigate = useNavigate();

    const location = useLocation();
    const navType = useNavigationType();
    const nvaParams = useParams();
    const [searchParams] = useSearchParams();

    const component: Component<Struct> = {
        props: {
            history: [],
            routes: undefined,
        },
        msgBroker: {
            provide: {
                'APP-NAV-GOTO': {
                    in: {
                        callback: async (msg) => {
                            navigate(msg.payload as To);
                        },
                    },
                    ex: {
                        callback: async (msg) => {
                            const route = msg.payload.route;
                            navigate(model.routes[route].path(msg.payload.params));
                        },
                    },
                },
                'APP-NAV-GET-CONTEXT': {
                    in: {
                        callback: (msg) => {
                            return model.history[model.history.length - 1];
                        },
                    },
                },
                'APP-NAV-READ-HISTORY': {
                    in: {
                        callback: (msg) => {
                            return model.history[model.history.length - 1];
                        },
                    },
                },
                'APP-NAV-CONTEXT-CHANGED': {
                    
                }
            },
        },
        events: {
            onLayout: (model) => {
                const history = model.history;
                if (history) {
                    const ctx = {
                        location: location,
                        searchParams: searchParams,
                        params: nvaParams,
                        navType: navType,
                    };
                    history.push(ctx);
                    model.msgBus.dispatch({
                        channel: 'APP-NAV-CONTEXT-CHANGED',
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

    const model = useComponent(component, params);

    // deps
    // location, navType, params, searchParams

    return model;
};

export type NavServiceStruct = Struct;
export const NavServiceFC = getFC(useNavService);
