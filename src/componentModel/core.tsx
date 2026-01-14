import React from 'react';
import { MsgBus } from '@actdim/msgmesh/contracts';
import { isObservable, runInAction, toJS, autorun, IReactionDisposer } from 'mobx';
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
import { isPlainObject } from 'mobx/dist/internal';

const blankView = () => null;

export function isBinding(obj: any): obj is Binding {
    return obj[$isBinding] === true;
}

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
        get: () => target()[prop],
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
                    options: {
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

export function getComponentMsgBus<TStruct extends ComponentStruct = ComponentStruct>(
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
        once: (params) => {
            return msgBus.once(params);
        },
        stream: (params) => {
            return msgBus.stream(params);
        },
        provide: (params) => {
            updateParams(params);
            return msgBus.provide(params);
        },
        send: (params) => {
            updateParams(params);
            return msgBus.send(params);
        },
        request: (params) => {
            updateParams(params);
            return msgBus.request(params);
        },
    } as MsgBus<TStruct['msg']>;
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

// TODO: move to utico
// function asyncToGeneratorFlow(asyncFn: (...args: any[]) => Promise<any>) {
//     return function* (...args: any[]) {
//         const result = yield asyncFn(...args);
//         return result;
//     };
// }
