import React, { useMemo } from 'react';
import { PropsWithChildren, useEffect, useLayoutEffect, FC, ReactNode } from 'react';
import {
    $CG_IN,
    $CG_OUT,
    $TypeArgHeaders,
    $TypeArgStruct,
    Msg,
    MsgBus,
    MsgProviderParams,
    MsgStruct,
    MsgSubscriberParams,
    OutStruct,
} from '@actdim/msgmesh/msgBusCore';
import { MaybePromise, SafeKey, Skip } from '@actdim/utico/typeCore';
import { observer } from 'mobx-react-lite';
import { observable, runInAction } from 'mobx';
import { useLazyRef } from '@/reactHooks';
import { getGlobalFlags } from '@/globals';
import { ReactComponentContext, useComponentContext } from './componentContext';
import { ComponentMsgHeaders, TreeNode } from './contracts';
import { lazy } from '@actdim/utico/utils';

export enum ComponentMsgFilter {
    None = 0,
    // AcceptFrom...
    FromAncestors = 1 << 0,
    FromDescendants = 1 << 1,
}

export type MsgChannelGroupProviderParams<
    TStruct extends MsgStruct = MsgStruct,
    TChannel extends keyof TStruct = keyof TStruct,
    TGroup extends keyof TStruct[TChannel] = typeof $CG_IN, // keyof TStruct[TChannel]
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TScope = any,
> = Skip<
    MsgProviderParams<TStruct, TChannel, TGroup>,
    'channel' | 'group' | 'callback' | 'filter'
> & {
    // resolve
    callback?: (
        msgIn: Msg<TStruct, TChannel, TGroup, TMsgHeaders>,
        headers: TMsgHeaders,
        scope: TScope,
    ) => MaybePromise<OutStruct<TStruct, TChannel>>;
    filter?: (msg: Msg<TStruct, TChannel, TGroup, TMsgHeaders>, scope: TScope) => boolean;
    componentFilter?: ComponentMsgFilter;
};

export type MsgChannelGroupSubscriberParams<
    TStruct extends MsgStruct = MsgStruct,
    TChannel extends keyof TStruct = keyof TStruct,
    TGroup extends keyof TStruct[TChannel] = typeof $CG_IN, // keyof TStruct[TChannel]
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TScope = any,
> = Skip<
    MsgSubscriberParams<TStruct, TChannel, TGroup>,
    'channel' | 'group' | 'callback' | 'filter'
> & {
    callback?: (msg: Msg<TStruct, TChannel, TGroup, TMsgHeaders>, scope: TScope) => void;
    filter?: (msg: Msg<TStruct, TChannel, TGroup, TMsgHeaders>, scope: TScope) => boolean;
    componentFilter?: ComponentMsgFilter;
};

// MsgScope
export type MsgBrokerScope<
    TStruct extends MsgStruct /*= MsgStruct*/,
    TKeysToProvide extends keyof TStruct = keyof TStruct,
    TKeysToSubscribe extends keyof TStruct = keyof TStruct,
    TKeysToPublish extends keyof TStruct = keyof TStruct,
> = {
    provide?: TKeysToProvide;
    // consume
    subscribe?: TKeysToSubscribe;
    // produce
    publish?: TKeysToPublish;
};

export type ComponentPropStruct = Record<string, any>;
// export type ComponentPropStruct = {
//     [prop: string]: any;
// };

export type ComponentMethodStruct = Record<string, Function>;
// export type ComponentMethodStruct = {
//     [action: string]: Function;
// };

// export type ComponentRefStruct = Record<string, ComponentStruct<TMsgStruct, T>>;
export type ComponentRefStruct = {
    [name: string]: ComponentStruct | ((params: any) => ComponentStruct);
};

export type ComponentStructBase<
    TMsgStruct extends MsgStruct = MsgStruct,
    TPropStruct extends ComponentPropStruct = ComponentPropStruct,
    TMsgScope extends MsgBrokerScope<TMsgStruct> = MsgBrokerScope<TMsgStruct>,
> = {
    props?: TPropStruct;
    methods?: ComponentMethodStruct;
    children?: ComponentRefStruct;
    msgScope?: TMsgScope;
};

// ComponentShape
export type ComponentStruct<
    TMsgStruct extends MsgStruct = MsgStruct,
    T extends ComponentStructBase<TMsgStruct> = ComponentStructBase<TMsgStruct>,
    // TMsgBus extends MsgBus<MsgStruct> = MsgBus<MsgStruct>,
    // T extends ComponentStructBase<TMsgBus[typeof $TypeArgStruct]> = ComponentStructBase<
    //     TMsgBus[typeof $TypeArgStruct]
    // >,
> = T & {
    msgBus: TMsgStruct;
    // msgBus: TMsgBus;
};

export type MsgBroker<
    TStructToProvide extends MsgStruct = MsgStruct,
    TStructToSubscribe extends MsgStruct = MsgStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TScope = any,
> = {
    // providers
    provide?: {
        [TChannel in keyof TStructToProvide]: {
            [TGroup in keyof Skip<
                TStructToProvide[TChannel],
                typeof $CG_OUT
            >]?: MsgChannelGroupProviderParams<
                TStructToProvide,
                TChannel,
                TGroup,
                TMsgHeaders,
                TScope
            >;
        };
    };
    // subscribers
    subscribe?: {
        [TChannel in keyof TStructToSubscribe]: {
            [TGroup in keyof TStructToSubscribe[TChannel]]?: MsgChannelGroupSubscriberParams<
                TStructToSubscribe,
                TChannel,
                TGroup,
                TMsgHeaders,
                TScope
            >;
        };
    };
    abortController?: AbortController;
};

type ValueConverter<TTo, TFrom> = {
    // ConvertFrom
    convert(value: TFrom): TTo;
    // ConvertTo
    convertBack(value: TTo): TFrom;
};

type ValidationResult = {
    valid: boolean;
    message: string;
};

type Validator<T> = {
    options: {
        blur: boolean;
    };
    validate: (value: T) => MaybePromise<ValidationResult>;
};

const $isBinding = Symbol('$isBinding'); // brand

class Binding<T = any, TFrom = any> {
    // getter
    readonly get: () => T;
    // setter
    readonly set: (value: T) => void;
    readonly converter: ValueConverter<T, TFrom>;
    readonly validator: Validator<T>;
    readonly readOnly: boolean;
    constructor(
        get: () => T,
        set?: (value: T) => void,
        converter?: ValueConverter<T, TFrom>,
        validator?: Validator<T>,
    ) {
        this.get = get;
        this.set = set;
        this.converter = converter;
        this.validator = validator;
        this.readOnly = !!set;
        this[$isBinding] = true;
    }
    [$isBinding]: boolean;
}

export function isBinding(obj: any): obj is Binding {
    return obj[$isBinding] === true;
}

export function bind<T, TFrom = any>(
    get: () => T,
    set?: (value: T) => void,
    converter?: ValueConverter<T, TFrom>,
    validator?: Validator<T>,
) {
    return new Binding(get, set, converter, validator);
}

export function bindProp<T extends object, P extends keyof T>(target: () => T, prop: P) {
    return new Binding(
        () => target()[prop],
        (value: T[P]) => {
            target()[prop] = value;
        },
    );
}

export type ComponentPropSource<T> = T | Binding<T>;

export type ComponentPropParams<TPropStruct extends ComponentPropStruct> = {
    [P in keyof TPropStruct]?: ComponentPropSource<TPropStruct[P]>;
};

// const $ON_PROP_CHANGING = "onPropChanging";
// const $ON_PROP_CHANGE = "onPropChange";

const $ON_GET = 'onGet';
// const $ON_BEFORE_SET = "onBeforeSet";
const $ON_CHANGING = 'onChanging';
const $ON_CHANGE = 'onChange';
// const $ON_SET = "onSet";

type PropValueChangingHandler<TProp = PropKey> = (
    prop: TProp,
    oldValue: any,
    newValue: any,
) => boolean;
type PropValueChangeHandler<TProp = PropKey> = (prop: TProp, value: any) => void;

// BeforeValueSetHandler
type ValueChangingHandler<T = any> = (oldValue: T, newValue: T) => boolean;
// ValueSetHandler
type ValueChangeHandler<T = any> = (value: T) => void;

type ComponentEvents<TStruct extends ComponentStruct = ComponentStruct> = {
    onPropChanging?: PropValueChangingHandler<keyof TStruct['props']>;
    onPropChange?: PropValueChangeHandler<keyof TStruct['props']>;
    onInit?: (model: ComponentModel<TStruct>) => void;
    onLayout?: (model: ComponentModel<TStruct>) => void;
    onReady?: (model: ComponentModel<TStruct>) => void;
    onLayoutDestroy?: (model: ComponentModel<TStruct>) => void; // onLayoutCleanup
    onDestroy?: (model: ComponentModel<TStruct>) => void; // onDispose/onCleanup
    onError?: (model: ComponentModel<TStruct>, error: any) => void;
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_GET}${Capitalize<P & string>}`]?: () => TStruct['props'][P];
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_CHANGING}${Capitalize<P & string>}`]?: ValueChangingHandler<
        TStruct['props']
    >;
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_CHANGE}${Capitalize<P & string>}`]?: ValueChangeHandler<
        TStruct['props']
    >;
};

// AllHTMLAttributes<JSX.Element>

type ComponentViewProps = {
    render?: boolean;
} & PropsWithChildren;

// ComponentRenderImplFn
type ComponentViewImplFn<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = (props: ComponentViewProps, model?: ComponentModel<TStruct, TMsgHeaders>) => ReactNode; // JSX.Element

// ComponentRenderFn
type ComponentViewFn = (props: ComponentViewProps) => ReactNode; // JSX.Element

type PublicKeys<T> = {
    [K in keyof T]: K extends `_${string}` ? never : K;
}[keyof T];

export type ComponentMsgBroker<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = MsgBroker<
    Pick<TStruct['msgBus'], SafeKey<TStruct['msgBus'], TStruct['msgScope']['provide']>>,
    Pick<TStruct['msgBus'], SafeKey<TStruct['msgBus'], TStruct['msgScope']['subscribe']>>,
    // Pick<
    //     TStruct['msgBus'][typeof $TypeArgStruct],
    //     SafeKey<TStruct['msgBus'][typeof $TypeArgStruct], TStruct['msgScope']['provide']>
    // >,
    // Pick<
    //     TStruct['msgBus'][typeof $TypeArgStruct],
    //     SafeKey<TStruct['msgBus'][typeof $TypeArgStruct], TStruct['msgScope']['subscribe']>
    // >,
    // TStruct['msgBus'][typeof $TypeArgHeaders],
    TMsgHeaders,
    // ComponentModel<TStruct, TStruct['msgBus'][typeof $TypeArgHeaders]>
    ComponentModel<TStruct, TMsgHeaders>
>;

export type Component<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    name?: string;
    props?: TStruct['props'];
    methods?: TStruct['methods'];
    children?: ComponentChildren<TStruct['children']>;
    events?: ComponentEvents<TStruct>;
    // msgs?
    msgBroker?: ComponentMsgBroker<TStruct, TMsgHeaders>;
    msgBus?: MsgBus<TStruct['msgBus'], TMsgHeaders>;
    // msgBus?: TStruct['msgBus'];
    view?: ComponentViewImplFn<TStruct, TMsgHeaders>;
};

type ComponentChildren<TRefStruct extends ComponentRefStruct> = {
    [P in keyof TRefStruct]: TRefStruct[P] extends (params: infer TParams) => infer T
        ? T extends ComponentStruct
            ? (params: TParams) => ComponentModel<T>
            : never
        : TRefStruct[P] extends ComponentStruct
          ? ComponentModel<TRefStruct[P]>
          : never;
};

type ComponentModelChildren<TRefStruct extends ComponentRefStruct> = {
    [P in keyof TRefStruct as TRefStruct[P] extends Function
        ? `${Capitalize<P & string>}`
        : P]: TRefStruct[P] extends (params: infer TParams) => infer T
        ? T extends ComponentStruct
            ? FC<ComponentParams<T> & TParams>
            : never
        : TRefStruct[P] extends ComponentStruct
          ? ComponentModel<TRefStruct[P]>
          : never;
};

export type ComponentModelContext = {
    bindings?: Map<PropKey, Binding>;
    id: string;
    parentId: string;
    // getHierarchyPath?
    getHierarchyId(): string;
    getParent: () => string | undefined;
    getChildren: () => string[];
    getChainUp: () => string[];
    getChainDown: () => string[];
    getNodeMap: () => Map<string, TreeNode>;
};

export type ComponentMsgStruct<TStruct extends ComponentStruct = ComponentStruct> = Pick<
    TStruct['msgBus'],
    | SafeKey<TStruct['msgBus'], TStruct['msgScope']['provide']>
    | SafeKey<TStruct['msgBus'], TStruct['msgScope']['subscribe']>
    | SafeKey<TStruct['msgBus'], TStruct['msgScope']['publish']>
    // TStruct['msgBus'][typeof $TypeArgStruct],
    // | SafeKey<TStruct['msgBus'][typeof $TypeArgStruct], TStruct['msgScope']['provide']>
    // | SafeKey<TStruct['msgBus'][typeof $TypeArgStruct], TStruct['msgScope']['subscribe']>
    // | SafeKey<TStruct['msgBus'][typeof $TypeArgStruct], TStruct['msgScope']['publish']>
>;

export type ComponentModelBase<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    msgBus: MsgBus<
        // TStruct["msgBus"]
        // TStruct["msgBus"][typeof $TypeArgStruct],
        ComponentMsgStruct<TStruct>,
        // TStruct['msgBus'][typeof $TypeArgHeaders]
        TMsgHeaders
    >;
    msgBroker: ComponentMsgBroker<TStruct>;
    View: ComponentViewFn;
    $: Readonly<ComponentModelContext>;
};

export type ComponentModel<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = TStruct['props'] &
    Readonly<TStruct['methods']> &
    Readonly<ComponentModelChildren<TStruct['children']>> &
    Readonly<ComponentModelBase<TStruct, TMsgHeaders>>;

// style: CSSProperties;

type PropEventHandlers = {
    onGet?: () => any;
    onChanging?: (oldValue: any, newValue: any) => boolean;
    onChange?: (value: any) => void;
};

type PropKey = string | symbol;
type ProxyEventHandlers = {
    onPropChanging?: PropValueChangingHandler<PropKey>;
    onPropChange?: PropValueChangeHandler<PropKey>;
} & Record<PropKey, PropEventHandlers>;

// ComponentConfig
export type ComponentParams<TStruct extends ComponentStruct = ComponentStruct> =
    ComponentPropParams<TStruct['props']> & ComponentEvents<TStruct>; // & PropsWithChildren

const blankView = () => null;

function createProxy(
    state: any,
    bindings: Map<PropKey, Binding>,
    proxyEventHandlers: ProxyEventHandlers,
) {
    const onPropChanging = proxyEventHandlers.onPropChanging;
    const onPropChange = proxyEventHandlers.onPropChange;
    return new Proxy(state, {
        get(obj, prop, receiver) {
            const onGet = proxyEventHandlers[prop]?.onGet;
            if (onGet) {
                return onGet();
            }

            const binding = bindings.get(String(prop));
            if (binding) {
                let value: any = undefined;
                value = binding.get();
                return value;
            }
            return Reflect.get(obj, prop, receiver);
        },
        set(obj, prop, value, receiver) {
            const oldValue = obj[prop];

            const onChanging = proxyEventHandlers[prop]?.onChanging;
            if (onChanging) {
                const shouldChange = onChanging(oldValue, value);
                if (!shouldChange) {
                    return true;
                }
            }

            if (onPropChanging) {
                const shouldChange = onPropChanging(prop, oldValue, value);
                if (!shouldChange) {
                    return true;
                }
            }

            const result = runInAction(() => {
                return Reflect.set(obj, prop, value, receiver);
            });

            const binding = bindings.get(prop);
            if (binding?.set) {
                binding.set(value);
            }

            const onChange = proxyEventHandlers[prop]?.onChange;
            if (onChange) {
                onChange(value);
            }

            if (onPropChange) {
                onPropChange(prop, value);
            }

            return result;
        },
    });
}

function capitalize(name: string) {
    return name.replace(/^./, name[0].toUpperCase());
}

function asyncToGeneratorFlow(asyncFn: (...args: any[]) => Promise<any>) {
    return function* (...args: any[]) {
        const result = yield asyncFn(...args);
        return result;
    };
}

type ComponentSourceInfo = {
    // classId
    structId: string;
    count: 0;
};

const componentData = {
    sources: new Map<string, ComponentSourceInfo>(),
    count: 0,
};

export function toHtmlId(url: string, segmentsCount: number = 1): string {
    const clean = url.split(/[?#]/)[0];
    const parts = clean
        .split('/')
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));

    const last = parts.slice(-segmentsCount);
    const raw = last.join('-');
    let id = raw
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9\-_:.+#]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[^a-zA-Z]+/, '-')
        .replace(/[+#]$/, '-');
    return id;
}

function getCallerFileName(depth = 2): string | null {
    const err = new Error();
    const stack = err.stack?.split('\n');
    if (!stack || stack.length <= depth) return null;

    const match = stack[depth].match(/\((.*):\d+:\d+\)/);
    if (match) {
        return match[1];
    }
    return null;
}

function registerMsgBroker<TStruct extends ComponentStruct = ComponentStruct>(
    model: ComponentModel<TStruct>,
) {
    const providers = model?.msgBroker.provide;
    if (providers) {
        for (const [channel, providerGroups] of Object.entries(providers)) {
            for (const [g, p] of Object.entries(providerGroups)) {
                const provider = p as MsgChannelGroupProviderParams;
                const callback = provider.callback;
                if (callback) {
                    provider.callback = (msg, headers) => {
                        return callback(msg, headers, model);
                    };
                }
                const filter = provider.filter;
                const componentFilter = provider.componentFilter || ComponentMsgFilter.None;
                const msgFilter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = model.$.getChainUp();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const ancestorIds = model.$.getChainDown();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, model);
                    }
                    return result;
                };
                provider.filter = msgFilter;

                model.msgBus.provide({
                    ...p,
                    channel: channel,
                    group: g,
                    config: {
                        abortSignal: model.msgBroker.abortController.signal,
                    },
                });
            }
        }
    }
    const subscribers = model?.msgBroker?.subscribe;
    if (subscribers) {
        for (const [channel, subscriberGroups] of Object.entries(subscribers)) {
            for (const [g, s] of Object.entries(subscriberGroups)) {
                const subscriber = s as MsgChannelGroupSubscriberParams;
                const callback = subscriber.callback;
                if (callback) {
                    subscriber.callback = (msg) => {
                        return callback(msg, model);
                    };
                }
                const filter = subscriber.filter;
                const componentFilter = subscriber.componentFilter || ComponentMsgFilter.None;
                const msgFilter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = model.$.getChainUp();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const ancestorIds = model.$.getChainDown();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, model);
                    }
                    return result;
                };
                subscriber.filter = msgFilter;

                model.msgBus.on({
                    ...s,
                    channel: channel,
                    group: g,
                    config: {
                        abortSignal: model.msgBroker.abortController.signal,
                    },
                });
            }
        }
    }
}

function getComponentMsgBus<TStruct extends ComponentStruct = ComponentStruct>(
    msgBus: MsgBus<TStruct['msgBus']>,
    modelContext: ComponentModelContext,
) {
    // ComponentModel<TStruct>['msgBus']
    const updateParams = (params: { headers?: ComponentMsgHeaders }) => {
        if (!params.headers) {
            params.headers = {};
        }
        if (params.headers.sourceId == undefined) {
            params.headers.sourceId = modelContext.id;
        }
    };
    return {
        config: msgBus.config,
        on: (params) => {
            return msgBus.on(params);
        },
        onceAsync: (params) => {
            return msgBus.onceAsync(params);
        },
        stream: (params) => {
            return msgBus.stream(params);
        },
        provide: (params) => {
            updateParams(params);
            return msgBus.provide(params);
        },
        dispatch: (params) => {
            updateParams(params);
            return msgBus.dispatch(params);
        },
        dispatchAsync: (params) => {
            updateParams(params);
            return msgBus.dispatchAsync(params);
        },
    } as MsgBus<TStruct['msgBus']>;
}

function createModel<TStruct extends ComponentStruct = ComponentStruct>(
    component: Component<TStruct>,
    params: ComponentParams<TStruct>,
): ComponentModel<TStruct> {
    const bindings = new Map<PropKey, Binding>();
    const view = component.view;

    let model: ComponentModel<TStruct>;

    let modelContext: ComponentModelContext;

    let msgBus = component.msgBus;

    const componentMsgBus = lazy(() => {
        return getComponentMsgBus(msgBus, modelContext) as ComponentModel<TStruct>['msgBus'];
    });

    let msgBroker = {
        ...component.msgBroker,
    };

    if (!msgBroker.abortController) {
        msgBroker.abortController = new AbortController();
    }

    const ViewFC = observer((props: ComponentViewProps) => {
        const id = modelContext.id;
        const context = useComponentContext();
        const parentId = context.currentId;

        modelContext.parentId = parentId;

        if (!msgBus) {
            msgBus = context.msgBus;
        }

        const scopeContext = useMemo(
            () => ({ ...context, currentId: id }),
            [component, params, context],
        );

        useLayoutEffect(() => {
            try {
                if (getGlobalFlags().debug) {
                    const hierarchyId = modelContext.getHierarchyId;
                    console.debug(`${hierarchyId}>layout`);
                }

                context.register(id, parentId);

                modelContext.getHierarchyId = () => context.getHierarchyPath(id);

                modelContext.getChainDown = () => context.getChainDown(id);
                modelContext.getChainUp = () => context.getChainUp(id);
                modelContext.getChildren = () => context.getChildren(id);
                modelContext.getParent = () => context.getParent(id);
                modelContext.getNodeMap = () => context.getNodeMap();

                registerMsgBroker(model);

                component.events?.onLayout?.(model);
                params?.onLayout?.(model);
            } catch (err) {
                component.events?.onError?.(model, err);
                params?.onError?.(model, err);
            }

            return () => {
                if (getGlobalFlags().debug) {
                    const hierarchyId = modelContext.getHierarchyId;
                    console.debug(`${hierarchyId}>layout-destroy`);
                }
                context.unregister(id);

                msgBroker.abortController.abort();

                component.events?.onLayoutDestroy?.(model);
                params?.onLayoutDestroy?.(model);
            };
        }, [component, params, context]);

        useEffect(() => {
            try {
                if (getGlobalFlags().debug) {
                    // mount
                    const hierarchyId = modelContext.getHierarchyId;
                    console.debug(`${hierarchyId}>ready`);
                }
                component.events?.onReady?.(model);
                params?.onReady?.(model);
            } catch (err) {
                if (getGlobalFlags().debug) {
                    // unmount
                    const hierarchyId = modelContext.getHierarchyId;
                    console.debug(`${hierarchyId}>destroy`);
                }
                component.events?.onError?.(model, err);
                params?.onError?.(model, err);
            }
            return () => {
                component.events?.onDestroy?.(model);
                params?.onDestroy?.(model);
            };
        }, [component, params, context]);

        let content: React.ReactNode;
        // let content: any;
        try {
            if (getGlobalFlags().debug) {
                // render
                const hierarchyId = modelContext.getHierarchyId;
                console.debug(`${hierarchyId}>view`);
            }
            if (typeof view === 'function') {
                content = view(props, model);
            } else {
                // content = props.children;
                content = <>{props.children}</>;
            }
        } catch (err) {
            // throw err;
            const errDetails = JSON.stringify(err);
            // msgBus.dispatch
            content = <>{errDetails}</>;
        }
        return (
            <ReactComponentContext.Provider value={scopeContext}>
                {content}
            </ReactComponentContext.Provider>
        );
    });

    let srcInfo: ComponentSourceInfo;
    const sources = componentData.sources;

    const fileName = getCallerFileName(6);
    const srcName = toHtmlId(fileName, 2);

    if (sources.has(fileName)) {
        srcInfo = sources.get(fileName);
        srcInfo.count++;
    } else {
        const structId = component.name || srcName || `Component_${componentData.count}`;
        srcInfo = {
            structId: structId,
            count: 0,
        };
        sources.set(fileName, srcInfo);
        componentData.count++;
    }

    const id = `${srcInfo.structId}#${srcInfo.count}`;
    modelContext = {
        bindings: bindings,
        id: id,
        parentId: undefined,
        getHierarchyId: () => undefined,
        getChainDown: () => undefined,
        getChainUp: () => undefined,
        getChildren: () => undefined,
        getParent: () => undefined,
        getNodeMap: () => undefined,
    };

    model = {
        ...component.props,
        ...component.methods,
        // view: component.view,
        View: ViewFC,
        get msgBus() {
            return componentMsgBus();
        },
        msgBroker: msgBroker,
        $: modelContext,
    };

    if (component.children) {
        for (const [key, value] of Object.entries(component.children)) {
            if (typeof value == 'function') {
                const view = value as (params: any) => ComponentModel;
                // observer
                const ChildViewFC: ComponentViewImplFn<TStruct> = (props) => {
                    const model = view(props);
                    return <model.View />;
                    // if (typeof model.view === "function") {
                    //     return model.view(props);
                    // }
                    // return <>{props.children}</>;
                };
                Reflect.set(model, capitalize(key), ChildViewFC);
            } else {
                Reflect.set(model, key, value);
            }
        }
    }

    // Reflect.ownKeys
    for (const [key, value] of Object.entries(params)) {
        if (isBinding(value)) {
            bindings.set(key, value);
        } else {
            Reflect.set(model, key, value);
        }
    }

    // decorators
    const annotationMap: Record<string, any> = {};

    if (component.props) {
        for (const key of Object.keys(component.props)) {
            annotationMap[key] = observable.ref;
        }
    }
    if (component.methods) {
        for (const key of Object.keys(component.methods)) {
            annotationMap[key] = false;
        }
    }
    if (component.children) {
        for (const key of Object.keys(component.children)) {
            annotationMap[key] = false;
        }
    }

    // annotationMap["view" satisfies keyof Component<TStruct>] = false;
    annotationMap['View' satisfies keyof ComponentModelBase<TStruct>] = false;
    annotationMap['msgBus' satisfies keyof ComponentModelBase<TStruct>] = false;
    annotationMap['$' satisfies keyof ComponentModelBase<TStruct>] = false;

    const proxyEventHandlers: Pick<ProxyEventHandlers, 'onPropChanging' | 'onPropChange'> = {
        onPropChanging:
            params?.onPropChanging || component.events?.onPropChanging
                ? (prop, oldValue, newValue) => {
                      let result = true;
                      let handler = params.onPropChanging;
                      if (handler) {
                          result = handler(String(prop), oldValue, newValue);
                      }
                      if (result) {
                          handler = component.events?.onPropChanging;
                          if (handler) {
                              result = handler(String(prop), oldValue, newValue);
                          }
                      }
                      return result;
                  }
                : undefined,
        onPropChange:
            params?.onPropChange || component.events?.onPropChange
                ? (prop, value) => {
                      params.onPropChange?.(String(prop), value);
                      component.events.onPropChange?.(String(prop), value);
                  }
                : undefined,
    };

    function resolveOnGetEventHandler(prop: string) {
        const key = `${$ON_GET}${capitalize(prop)}`;
        return params[key] || component.events?.[key];
    }

    function resolveOnChangingEventHandler(prop: string) {
        const key = `${$ON_CHANGING}${capitalize(prop)}`;
        return ((oldValue: any, newValue: any) => {
            let result = true;
            let handler = params[key] as ValueChangingHandler<any>;
            if (handler) {
                result = handler(oldValue, newValue);
            }
            if (result) {
                handler = component.events[key] as ValueChangingHandler<any>;
                if (handler) {
                    result = handler(oldValue, newValue);
                }
            }
            return result;
        }) as ValueChangingHandler;
    }

    function resolveOnChangeEventHandler(prop: string) {
        const key = `${$ON_CHANGE}${capitalize(prop)}`;
        return ((value: any) => {
            (params[key] as ValueChangeHandler<any>)?.(value);
            (component.events[key] as ValueChangeHandler<any>)?.(value);
        }) as ValueChangeHandler;
    }

    if (component.props) {
        for (const prop of Object.keys(component.props)) {
            proxyEventHandlers[prop] = {
                onGet: resolveOnGetEventHandler(prop),
                onChanging: resolveOnChangingEventHandler(prop),
                onChange: resolveOnChangeEventHandler(prop),
            };
        }
    }

    model = observable(model, annotationMap, {
        deep: true,
    });
    // model = useLocalObservable(() => model, annotationMap);

    model = createProxy(model, bindings, proxyEventHandlers);

    if (component.events?.onInit) {
        component.events.onInit(model);
    }

    if (params?.onInit) {
        params.onInit(model);
    }

    return model;
}

export function useComponent<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(component: Component<TStruct, TMsgHeaders>, params: ComponentParams<TStruct>) {
    const ref = useLazyRef(() => createModel(component, params));
    useLayoutEffect(() => {
        return () => {
            ref.current = null;
        };
    }, [component, params]);
    return ref.current;
}

// asFC/toFC
export function getFC<TStruct extends ComponentStruct>(
    factory: (params: ComponentParams<TStruct>) => ComponentModel<TStruct>,
): FC<ComponentParams<TStruct>> {
    // observer
    const fc = (params: ComponentParams<TStruct> & PropsWithChildren) => {
        // modelHook
        const model = factory(params); // without useRef!
        // return model.view();
        return <model.View {...params} />;
        // return <ViewerFC {...params} view={model.view} />;
    };
    return fc;
}
