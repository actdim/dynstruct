import { MsgBus, MsgSubOptions, PromiseOptions } from '@actdim/msgmesh/contracts';
import { isObservable, runInAction, toJS, autorun, IReactionDisposer, observable } from 'mobx';
import type {
    Binding,
    Component,
    ComponentMsgHeaders,
    ComponentStruct,
    EffectController,
    EffectFn,
    MsgChannelGroupProviderParams,
    MsgChannelGroupSubscriberParams,
    PropEventHandlers,
    PropValueChangeHandler,
    PropValueChangingHandler,
    Validator,
    ValueConverter,
} from './contracts';
import { $isBinding, ComponentMsgFilter } from './contracts';
// import { isPlainObject } from 'mobx/dist/internal';

// onReactionError((err, derivation) => {
//     console.error(`Reaction "${derivation.name_}" error:`, err);
// });

const blankView = () => null;

export function bind<T, TFrom = any>(
    get: () => T,
    set?: (value: T) => void,
    converter?: ValueConverter<T, TFrom>,
    validator?: Validator<T>,
): Binding {
    return {
        get: get,
        set: set,
        converter: converter,
        validator: validator,
        readOnly: !!set,
        [$isBinding]: true,
    };
}

export function bindProp<T extends object, P extends keyof T>(target: () => T, prop: P): Binding {
    return {
        get: () => target()?.[prop],
        set: (value: T[P]) => {
            target()[prop] = value;
        },
        [$isBinding]: true,
    };
}

const proxyCache = new WeakMap<object, any>();

export type ProxyEventHandlers = {
    onPropChanging?: PropValueChangingHandler<PropertyKey>;
    onPropChange?: PropValueChangeHandler<PropertyKey>;
} & Record<PropertyKey, PropEventHandlers>;

export function createRecursiveProxy(
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

            const value = Reflect.get(obj, prop, receiver);
            if (binding?.get) {
                return binding.get();
            }

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

export function toHtmlId(url: string): string {
    let parts = url
        .split('/')
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));

    const raw = parts.join('-');
    // sanitize
    let id = raw
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9\-_:.+#]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[^a-zA-Z]+/, '-')
        // .replace(/:/g, '-')
        // .replace(/\./g, '_')
        // .replace(/#/g, '-')
        .replace(/[+#]$/, '-');
    return id;
}

export function getComponentSourceByCaller(depth = 2): string | null {
    const err = new Error();
    const stack = err.stack?.split('\n');
    if (!stack || stack.length <= depth) {
        return null;
    }
    const match = stack[depth].match(/\(([^)]+)\)/);
    const result = match?.[1];
    if (result) {
        if (
            document.querySelector('script[type="module"][src*="/@vite/"]') &&
            globalThis['CONFIG_TYPE'] === 'DEVELOPMENT'
        ) {
            return result.replace(/\?[^:]+/, '');
        }
    }
    return result;
}

export function getComponentNameByCaller(depth = 2): string | null {
    const err = new Error();
    const stack = err.stack?.split('\n');
    if (!stack || stack.length <= depth) {
        return null;
    }
    const line = stack[depth].trim();
    const match = line.match(/^at\s+([^\s(]+)/);
    if (!match) {
        return null;
    }
    const fnName = match[1];
    const hookMatch = fnName.match(/^use(.+)/);
    if (hookMatch) {
        return hookMatch[1];
    }
    return fnName;
}

export function registerMsgBroker<TStruct extends ComponentStruct = ComponentStruct>(
    component: Component<TStruct>,
) {
    const providers = component?.msgBroker.provide;
    if (providers) {
        for (const [channel, providerGroups] of Object.entries(providers)) {
            for (const [g, p] of Object.entries(providerGroups)) {
                const providerParams = p as MsgChannelGroupProviderParams;
                const callback = providerParams.callback;
                if (callback) {
                    providerParams.callback = (msg, headers) => {
                        return callback(msg, headers, component);
                    };
                }
                const filter = providerParams.filter;
                const componentFilter = providerParams.componentFilter || ComponentMsgFilter.None;
                providerParams.filter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = component.getChainUp();
                        result = ancestorIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const descendantIds = component.getChainDown();
                        result = descendantIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, component);
                    }
                    return result;
                };

                component.msgBus.provide({
                    ...p,
                    channel: channel,
                    group: g,
                });
            }
        }
    }
    const subscribers = component?.msgBroker?.subscribe;
    if (subscribers) {
        for (const [channel, subscriberGroups] of Object.entries(subscribers)) {
            for (const [g, s] of Object.entries(subscriberGroups)) {
                const subscriberParams = s as MsgChannelGroupSubscriberParams;
                const callback = subscriberParams.callback;
                if (callback) {
                    subscriberParams.callback = (msg) => {
                        return callback(msg, component);
                    };
                }
                const filter = subscriberParams.filter;
                const componentFilter = subscriberParams.componentFilter || ComponentMsgFilter.None;
                subscriberParams.filter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = component.getChainUp();
                        result = ancestorIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const descendantIds = component.getChainDown();
                        result = descendantIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, component);
                    }
                    return result;
                };

                component.msgBus.on({
                    ...s,
                    channel: channel,
                    group: g,
                });
            }
        }
    }
}

export function getComponentMsgBus<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    msgBus: MsgBus<TStruct['msg'], TMsgHeaders>,
    globalAbortSignal: AbortSignal,
    headerSetter: (headers?: TMsgHeaders) => void,
) {
    type OpParams = {
        headers?: TMsgHeaders;
        options?: PromiseOptions | MsgSubOptions;
        payload?: unknown;
    };
    function getParams<TParams extends OpParams>(params: TParams, hasHeaders = false) {
        if (hasHeaders && !params.headers) {
            params.headers = {} as TMsgHeaders;
        }
        headerSetter?.(params.headers);
        if (params.payload != undefined) {
            params.payload = structuredClone(toJS(params.payload));
        }
        if (!params.options) {
            params.options = {};
        }
        let abortSignal = globalAbortSignal;
        if (params.options.abortSignal) {
            abortSignal = AbortSignal.any([params.options.abortSignal, globalAbortSignal]);
        }
        params.options.abortSignal = abortSignal;
        return params;
    }
    return {
        config: msgBus.config,
        on: (params) => {
            return msgBus.on(getParams(params, false));
        },
        once: (params) => {
            return msgBus.once(getParams(params, false));
        },
        stream: (params) => {
            return msgBus.stream(getParams(params, false));
        },
        provide: (params) => {
            return msgBus.provide(getParams(params, true));
        },
        send: (params) => {
            return msgBus.send(getParams(params, true));
        },
        request: (params) => {
            return msgBus.request(getParams(params, true));
        },
    } as MsgBus<TStruct['msg'], TMsgHeaders>;
}

export function createEffect<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    component: Component<TStruct, TMsgHeaders>,
    name: string,
    fn: EffectFn<TStruct, TMsgHeaders>,
): EffectController {
    let disposer: IReactionDisposer | null = null;

    const paused = observable.box(false);

    const start = () => {
        if (disposer) {
            return;
        }
        runInAction(() => {
            paused.set(false);
            disposer = autorun(
                () => {
                    if (!paused.get()) {
                        fn(component);
                    }
                },
                {
                    name: `${component.id}/effects/${name}`,
                },
            );
        });
    };

    const stop = () => {
        disposer?.();
        disposer = null;
    };

    const pause = () => {
        runInAction(() => {
            paused.set(true);
        });
    };

    const resume = () => {
        runInAction(() => {
            paused.set(false);
        });
    };

    start();

    return { pause, resume, stop };
}

// TODO: move to utico
// function asyncToGeneratorFlow(asyncFn: (...args: any[]) => Promise<any>) {
//     return function* (...args: any[]) {
//         const result = yield asyncFn(...args);
//         return result;
//     };
// }

// TODO: simple JSX factory as child component
// TODO: Support async resources via msgbus (TanStack Query/SWR + Suspense)
// TODO: Support control persistence (with providers)
// TODO: request cancelation in msgbus
// TODO: control requestCount via msgbus (for busy state indicator)
