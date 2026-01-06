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
import {
    Extends,
    HasKeys,
    IF,
    IsEmpty,
    MaybeKeyOf,
    MaybePromise,
    Mutable,
    Require,
    Skip,
} from '@actdim/utico/typeCore';
import { observer } from 'mobx-react-lite';
import {
    action,
    isObservable,
    observable,
    runInAction,
    toJS,
    autorun,
    IReactionDisposer,
} from 'mobx';
import { useLazyRef } from '@/reactHooks';
import { getGlobalFlags } from '@/globals';
import { ReactComponentContext, useComponentContext } from './componentContext';
import { ComponentMsgHeaders, TreeNode } from './contracts';
import { lazy } from '@actdim/utico/utils';
import { isPlainObject } from 'mobx/dist/internal';

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
    actions?: ComponentMethodStruct;
    effects?: string[] | string | undefined;
    children?: ComponentRefStruct;
    // msgs?
    msgScope?: TMsgScope;
};

// ComponentShape
export type ComponentStruct<
    TMsgStruct extends MsgStruct = MsgStruct,
    T extends ComponentStructBase<TMsgStruct> = ComponentStructBase<TMsgStruct>,
> = T & {
    msg: TMsgStruct;
};

export type MsgBroker<
    TStructToProvide extends MsgStruct = MsgStruct,
    TStructToSubscribe extends MsgStruct = MsgStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TScope = any,
> = Require<
    {
        // providers
        provide?: Require<
            {
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
            },
            HasKeys<TStructToProvide>
        >;
        // subscribers
        subscribe?: Require<
            {
                [TChannel in keyof TStructToSubscribe]: {
                    [TGroup in keyof TStructToSubscribe[TChannel]]?: MsgChannelGroupSubscriberParams<
                        TStructToSubscribe,
                        TChannel,
                        TGroup,
                        TMsgHeaders,
                        TScope
                    >;
                };
            },
            HasKeys<TStructToSubscribe>
        >;
        abortController?: AbortController;
    },
    HasKeys<TStructToProvide & TStructToSubscribe>
>;

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

type PropValueChangingHandler<TProp = PropertyKey> = (
    prop: TProp,
    oldValue: any,
    newValue: any,
) => boolean;
type PropValueChangeHandler<TProp = PropertyKey> = (prop: TProp, value: any) => void;

// BeforeValueSetHandler
type ValueChangingHandler<T = any> = (oldValue: T, newValue: T) => boolean;
// ValueSetHandler
type ValueChangeHandler<T = any> = (value: T) => void;

type ComponentEvents<TStruct extends ComponentStruct = ComponentStruct> = {
    onPropChanging?: PropValueChangingHandler<keyof TStruct['props']>;
    onPropChange?: PropValueChangeHandler<keyof TStruct['props']>;
    onInit?: (component: Component<TStruct>) => void;
    onLayout?: (component: Component<TStruct>) => void;
    onReady?: (component: Component<TStruct>) => void;
    onLayoutDestroy?: (component: Component<TStruct>) => void; // onLayoutCleanup
    onDestroy?: (component: Component<TStruct>) => void; // onDispose/onCleanup
    onError?: (component: Component<TStruct>, error: any) => void;
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
> = (props: ComponentViewProps, component?: Component<TStruct, TMsgHeaders>) => ReactNode; // JSX.Element

// ComponentRenderFn
type ComponentViewFn = (props: ComponentViewProps) => ReactNode; // JSX.Element

type PublicKeys<T> = {
    [K in keyof T]: K extends `_${string}` ? never : K;
}[keyof T];

export type ComponentMsgBroker<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = MsgBroker<
    // Pick<TStruct['msg'], MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['provide']>>,
    Pick<TStruct['msg'], TStruct['msgScope']['provide']>,
    // Pick<TStruct['msg'], MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['subscribe']>>,
    Pick<TStruct['msg'], TStruct['msgScope']['subscribe']>,
    TMsgHeaders,
    Component<TStruct, TMsgHeaders>
>;

export type EffectFn<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = (component: Component<TStruct, TMsgHeaders>) => void | (() => void);

export type ComponentDef<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    name?: string;
    props?: Require<TStruct['props'], HasKeys<TStruct['props']>>;
    actions?: Require<TStruct['actions'], HasKeys<TStruct['actions']>>;
    effects?: keyof TStruct['effects'] extends never
        ? never
        : Record<
              TStruct['effects'] extends string ? TStruct['effects'] : TStruct['effects'][number],
              EffectFn<TStruct, TMsgHeaders>
          >;
    children?: ComponentDefChildren<TStruct['children']>;
    events?: ComponentEvents<TStruct>;
    // msgs?
    msgBroker?: ComponentMsgBroker<TStruct, TMsgHeaders>;
    msgBus?: MsgBus<TStruct['msg'], TMsgHeaders>;
    view?: ComponentViewImplFn<TStruct, TMsgHeaders>;
};

type ComponentDefChildren<TRefStruct extends ComponentRefStruct> = Require<
    {
        [P in keyof TRefStruct]: TRefStruct[P] extends (params: infer TParams) => infer T
            ? T extends ComponentStruct
                ? (params: TParams) => Component<T>
                : never
            : TRefStruct[P] extends ComponentStruct
              ? Component<TRefStruct[P]>
              : never;
    },
    HasKeys<TRefStruct>
>;

type ComponentChildren<TRefStruct extends ComponentRefStruct> = {
    [P in keyof TRefStruct as TRefStruct[P] extends Function
        ? `${Capitalize<P & string>}`
        : P]: TRefStruct[P] extends (params: infer TParams) => infer T
        ? T extends ComponentStruct
            ? FC<ComponentParams<T> & TParams>
            : never
        : TRefStruct[P] extends ComponentStruct
          ? Component<TRefStruct[P]>
          : never;
};

export type ComponentMsgStruct<TStruct extends ComponentStruct = ComponentStruct> = Pick<
    TStruct['msg'],
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['provide']>
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['subscribe']>
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['publish']>
>;

export type ComponentBase<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    id: string;
    parentId: string;
    // getHierarchyPath?
    getHierarchyId(): string;
    getParent(): string | undefined;
    getChildren(): string[];
    getChainUp(): string[];
    getChainDown(): string[];
    getNodeMap(): Map<string, TreeNode>;
    bindings: Map<PropertyKey, Binding>;
    msgBus: MsgBus<ComponentMsgStruct<TStruct>, TMsgHeaders>;
    msgBroker: ComponentMsgBroker<TStruct>;
    effects: Record<string, EffectController>;
    View: ComponentViewFn;
};

export type ComponentModel<TStruct extends ComponentStruct = ComponentStruct> = TStruct['props'] &
    Readonly<TStruct['actions']>;

export type Component<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    readonly model: ComponentModel<TStruct>;
    readonly children: Readonly<ComponentChildren<TStruct['children']>>;
} & Readonly<ComponentBase<TStruct, TMsgHeaders>>;

// style: CSSProperties;

type PropEventHandlers = {
    onGet?: () => any;
    onChanging?: (oldValue: any, newValue: any) => boolean;
    onChange?: (value: any) => void;
};

type ProxyEventHandlers = {
    onPropChanging?: PropValueChangingHandler<PropertyKey>;
    onPropChange?: PropValueChangeHandler<PropertyKey>;
} & Record<PropertyKey, PropEventHandlers>;

// ComponentConfig
export type ComponentParams<TStruct extends ComponentStruct = ComponentStruct> =
    ComponentPropParams<TStruct['props']> & ComponentEvents<TStruct>; // & PropsWithChildren

const blankView = () => null;

const proxyCache = new WeakMap<object, any>();
function createRecursiveProxy(
    target: any,
    bindings: Map<PropertyKey, Binding>,
    handlers: ProxyEventHandlers,
) {
    if (typeof target !== 'object' || target === null) {
        return target;
    }

    // isPlainObject
    if (!isObservable(target)) {
        return target;
    }

    if (proxyCache.has(target)) {
        return proxyCache.get(target);
    }

    const proxy = new Proxy(target, {
        get(obj, prop, receiver) {
            // 1. custom handlers
            const onGet = handlers[prop]?.onGet;
            if (onGet) return onGet();

            // 2. bindings
            const binding = bindings.get(prop);
            if (binding?.get) {
                return binding.get();
            }

            const value = Reflect.get(obj, prop, receiver);

            if (typeof value === 'object' && value !== null && isObservable(value)) {
                return createRecursiveProxy(value, bindings, handlers);
            }

            return value;
        },

        set(obj, prop, value, receiver) {
            const oldValue = obj[prop];

            // before-change hooks
            const onChanging = handlers[prop]?.onChanging;
            if (onChanging && onChanging(oldValue, value) === false) {
                return true;
            }

            if (
                handlers.onPropChanging &&
                handlers.onPropChanging(prop, oldValue, value) === false
            ) {
                return true;
            }

            const result = runInAction(() => {
                return Reflect.set(obj, prop, value, receiver);
            });

            // bindings
            const binding = bindings.get(prop);
            binding?.set?.(value);

            // after-change hooks
            handlers[prop]?.onChange?.(value);
            handlers.onPropChange?.(prop, value);

            return result;
        },
    });

    proxyCache.set(target, proxy);
    return proxy;
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
    component: Component<TStruct>,
) {
    const providers = component?.msgBroker.provide;
    if (providers) {
        for (const [channel, providerGroups] of Object.entries(providers)) {
            for (const [g, p] of Object.entries(providerGroups)) {
                const provider = p as MsgChannelGroupProviderParams;
                const callback = provider.callback;
                if (callback) {
                    provider.callback = (msg, headers) => {
                        return callback(msg, headers, component);
                    };
                }
                const filter = provider.filter;
                const componentFilter = provider.componentFilter || ComponentMsgFilter.None;
                const msgFilter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = component.getChainUp();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const ancestorIds = component.getChainDown();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, component);
                    }
                    return result;
                };
                provider.filter = msgFilter;

                component.msgBus.provide({
                    ...p,
                    channel: channel,
                    group: g,
                    config: {
                        abortSignal: component.msgBroker.abortController.signal,
                    },
                });
            }
        }
    }
    const subscribers = component?.msgBroker?.subscribe;
    if (subscribers) {
        for (const [channel, subscriberGroups] of Object.entries(subscribers)) {
            for (const [g, s] of Object.entries(subscriberGroups)) {
                const subscriber = s as MsgChannelGroupSubscriberParams;
                const callback = subscriber.callback;
                if (callback) {
                    subscriber.callback = (msg) => {
                        return callback(msg, component);
                    };
                }
                const filter = subscriber.filter;
                const componentFilter = subscriber.componentFilter || ComponentMsgFilter.None;
                const msgFilter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = component.getChainUp();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const ancestorIds = component.getChainDown();
                        result = ancestorIds.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, component);
                    }
                    return result;
                };
                subscriber.filter = msgFilter;

                component.msgBus.on({
                    ...s,
                    channel: channel,
                    group: g,
                    config: {
                        abortSignal: component.msgBroker.abortController.signal,
                    },
                });
            }
        }
    }
}

function getComponentMsgBus<TStruct extends ComponentStruct = ComponentStruct>(
    msgBus: MsgBus<TStruct['msg']>,
    headerSetter: (headers?: ComponentMsgHeaders) => void,
) {
    const updateParams = (params: { payload?: any; headers?: ComponentMsgHeaders }) => {
        if (params.payload != undefined) {
            params.payload = structuredClone(toJS(params.payload)); // always?
        }
        if (!params.headers) {
            params.headers = {};
        }
        headerSetter?.(params.headers);
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
    } as MsgBus<TStruct['msg']>;
}

export type EffectController = {
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    restart: () => void;
};

export function createEffect<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    component: Component<TStruct, TMsgHeaders>,
    name: string,
    fn: EffectFn<TStruct, TMsgHeaders>,
): EffectController {
    let disposer: IReactionDisposer | null = null;
    let paused = false;
    let effectCleanup: () => void = undefined;

    const start = () => {
        if (disposer) {
            return;
        }

        disposer = autorun(
            () => {
                if (!paused) {
                    const cleanup = fn(component);
                    if (typeof cleanup === 'function') {
                        cleanup();
                        effectCleanup = cleanup;
                    }
                }
            },
            { name: `effect:${name}` },
        );
    };

    const stop = () => {
        disposer?.();
        disposer = null;
        if (effectCleanup) {
            effectCleanup();
            effectCleanup = undefined;
        }
    };

    const pause = () => {
        paused = true;
    };

    const resume = () => {
        paused = false;
    };

    const restart = () => {
        stop();
        start();
    };

    start();

    return { start, pause, resume, stop, restart };
}

function createComponent<TStruct extends ComponentStruct = ComponentStruct>(
    componentDef: ComponentDef<TStruct>,
    params?: ComponentParams<TStruct>,
): Component<TStruct> {
    // result
    let component: Mutable<Component<TStruct>>;
    let model: Mutable<ComponentModel<TStruct>>;

    if (!componentDef) {
        componentDef = {};
    }

    if (!params) {
        params = {};
    }

    const view = componentDef.view;
    let msgBus = componentDef.msgBus;

    const bindings = new Map<PropertyKey, Binding>();

    const componentMsgBus = lazy(() => {
        return getComponentMsgBus(msgBus, (headers) => {
            if (headers?.sourceId == undefined) {
                headers.sourceId = component.id;
            }
        }); // as ComponentModel<TStruct>['msgBus']
    });

    let msgBroker = {
        ...componentDef.msgBroker,
    };

    if (!msgBroker.abortController) {
        msgBroker.abortController = new AbortController();
    }

    const ViewFC = observer((props: ComponentViewProps) => {
        const id = component.id;
        const context = useComponentContext();
        const parentId = context.currentId;

        component.parentId = parentId;

        if (!msgBus) {
            msgBus = context.msgBus;
        }

        const scopeContext = useMemo(
            () => ({ ...context, currentId: id }),
            [componentDef, params, context],
        );

        useLayoutEffect(() => {
            try {
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout`);
                }

                context.register(id, parentId);

                component.getHierarchyId = () => context.getHierarchyPath(id);
                component.getChainDown = () => context.getChainDown(id);
                component.getChainUp = () => context.getChainUp(id);
                component.getChildren = () => context.getChildren(id);
                component.getParent = () => context.getParent(id);
                component.getNodeMap = () => context.getNodeMap();

                registerMsgBroker(component);

                componentDef.events?.onLayout?.(component);
                params.onLayout?.(component);
            } catch (err) {
                componentDef.events?.onError?.(component, err);
                params.onError?.(component, err);
            }

            return () => {
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-destroy`);
                }
                context.unregister(id);

                msgBroker.abortController?.abort();

                componentDef.events?.onLayoutDestroy?.(component);
                params.onLayoutDestroy?.(component);
            };
        }, [componentDef, params, context]);

        useEffect(() => {
            try {
                if (getGlobalFlags().debug) {
                    // mount
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>ready`);
                }
                componentDef.events?.onReady?.(component);
                params.onReady?.(component);
            } catch (err) {
                if (getGlobalFlags().debug) {
                    // unmount
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>destroy`);
                }
                componentDef.events?.onError?.(component, err);
                params.onError?.(component, err);
            }
            return () => {
                componentDef.events?.onDestroy?.(component);
                params.onDestroy?.(component);
            };
        }, [componentDef, params, context]);

        let content: React.ReactNode;
        // let content: any;
        try {
            if (getGlobalFlags().debug) {
                // render
                const hierarchyId = component.getHierarchyId();
                console.debug(`${hierarchyId}>view`);
            }
            if (typeof view === 'function') {
                content = view(props, component);
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
        const structId = componentDef.name || srcName || `Component_${componentData.count}`;
        srcInfo = {
            structId: structId,
            count: 0,
        };
        sources.set(fileName, srcInfo);
        componentData.count++;
    }

    const id = `${srcInfo.structId}#${srcInfo.count}`;

    const children = {} as ComponentChildren<TStruct['children']>;

    model = {} as Mutable<ComponentModel<TStruct>>;

    if (componentDef.props) {
        Object.assign(model, componentDef.props);
    }

    if (componentDef.actions) {
        Object.assign(model, componentDef.actions);
    }

    if (componentDef.children) {
        for (const [key, value] of Object.entries(componentDef.children)) {
            if (typeof value == 'function') {
                const view = value as (params: any) => Component;
                // observer
                const ChildViewFC: ComponentViewImplFn<TStruct> = (props) => {
                    const c = view(props);
                    return <c.View />;
                    // if (typeof c.view === "function") {
                    //     return c.view(props);
                    // }
                    // return <>{props.children}</>;
                };
                Reflect.set(children, capitalize(key), ChildViewFC);
            } else {
                Reflect.set(children, key, value);
            }
        }
    }

    // Reflect.ownKeys/Object.keys
    for (const [key, value] of Object.entries(params)) {
        // model.hasOwnProperty(key)
        if (key in model) {
            if (isBinding(value)) {
                bindings.set(key, value);
            } else {
                Reflect.set(model, key, value);
            }
        }
    }

    const proxyEventHandlers: Pick<ProxyEventHandlers, 'onPropChanging' | 'onPropChange'> = {
        onPropChanging:
            params.onPropChanging || componentDef.events?.onPropChanging
                ? (prop, oldValue, newValue) => {
                      let result = true;
                      let handler = params.onPropChanging;
                      if (handler) {
                          result = handler(String(prop), oldValue, newValue);
                      }
                      if (result) {
                          handler = componentDef.events?.onPropChanging;
                          if (handler) {
                              result = handler(String(prop), oldValue, newValue);
                          }
                      }
                      return result;
                  }
                : undefined,
        onPropChange:
            params.onPropChange || componentDef.events?.onPropChange
                ? (prop, value) => {
                      params.onPropChange?.(String(prop), value);
                      componentDef.events?.onPropChange?.(String(prop), value);
                  }
                : undefined,
    };

    function resolveOnGetEventHandler(prop: string) {
        const key = `${$ON_GET}${capitalize(prop)}`;
        return params[key] || componentDef.events?.[key];
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
                handler = componentDef.events?.[key] as ValueChangingHandler<any>;
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
            (componentDef.events?.[key] as ValueChangeHandler<any>)?.(value);
        }) as ValueChangeHandler;
    }

    let annotationMap: Record<string, any> = {};

    if (componentDef.props) {
        for (const prop of Object.keys(componentDef.props)) {
            proxyEventHandlers[prop] = {
                onGet: resolveOnGetEventHandler(prop),
                onChanging: resolveOnChangingEventHandler(prop),
                onChange: resolveOnChangeEventHandler(prop),
            };
        }

        for (const key of Object.keys(componentDef.props)) {
            annotationMap[key] = observable.deep;
        }
    }

    if (componentDef.actions) {
        const annotationMap: Record<string, any> = {};
        for (const key of Object.keys(componentDef.actions)) {
            annotationMap[key] = action;
        }
    }

    model = observable(model, annotationMap, {
        deep: true,
    });

    model = createRecursiveProxy(model, bindings, proxyEventHandlers);

    let effects: Record<string, EffectController> = {};
    component = {
        id: id,
        parentId: undefined,
        getHierarchyId: () => undefined,
        getChainDown: () => undefined,
        getChainUp: () => undefined,
        getChildren: () => undefined,
        getParent: () => undefined,
        getNodeMap: () => undefined,
        bindings: bindings,
        get msgBus() {
            return componentMsgBus();
        },
        msgBroker: msgBroker,
        effects: effects,
        // view: componentDef.view,
        View: ViewFC,
        children: children,
        model: model,
    };

    if (componentDef.effects) {
        for (const [name, fn] of Object.entries(componentDef.effects)) {
            effects[name] = createEffect(
                component,
                name,
                fn as EffectFn<TStruct, ComponentMsgHeaders>,
            );
        }
    }

    if (componentDef.events?.onInit) {
        componentDef.events.onInit(component);
    }

    if (params.onInit) {
        params.onInit(component);
    }

    return component;
}

export function useComponent<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(componentDef: ComponentDef<TStruct, TMsgHeaders>, params: ComponentParams<TStruct>) {
    const ref = useLazyRef(() => createComponent(componentDef, params));
    useLayoutEffect(() => {
        return () => {
            ref.current = null;
        };
    }, [componentDef, params]);
    return ref.current;
}

// asFC/toFC
export function getFC<TStruct extends ComponentStruct>(
    factory: (params: ComponentParams<TStruct>) => Component<TStruct>,
): FC<ComponentParams<TStruct>> {
    // observer
    const fc = (params: ComponentParams<TStruct> & PropsWithChildren) => {
        // componentHook
        const c = factory(params); // without useRef!
        // return c.view();
        return <c.View {...params} />;
    };
    return fc;
}
