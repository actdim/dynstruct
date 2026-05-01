import { MsgBus, MsgSubOptions, PromiseOptions } from '@actdim/msgmesh/contracts';
import { runInAction, toJS, autorun, IReactionDisposer, observable, action } from 'mobx';
import type {
    Binding,
    BlurEventHandler,
    ChangeEventHandler,
    Component,
    ComponentDef,
    ComponentModel,
    ComponentMsgHeaders,
    ComponentParams,
    ComponentProp,
    ComponentPropState,
    ComponentState,
    ComponentStruct,
    EffectController,
    EffectFn,
    MsgChannelGroupProviderParams,
    MsgChannelGroupSubscriberParams,
    PropEventHandlers,
    PropValueChangeHandler,
    PropValueChangingHandler,
    ValidationResult,
    ValueChangeHandler,
    ValueChangingHandler,
    ValueConverter,
} from './contracts';
import {
    $isBinding,
    $isComponentProp,
    $ON_CHANGE,
    $ON_CHANGING,
    $ON_GET,
    ComponentMsgFilter,
    isBinding,
    isComponentProp,
} from './contracts';
import {
    Func,
    getByKeyPath,
    KeyPath,
    KeyPathValue,
    MaybePromise,
    Mutable,
    setByKeyPath,
} from '@actdim/utico/typeCore';
import { capitalize } from './util';
import { keyOf } from '@actdim/utico/typeUtils';
// import { isPlainObject } from 'mobx/dist/internal';

// onReactionError((err, derivation) => {
//     console.error(`Reaction "${derivation.name_}" error:`, err);
// });

const blankView = () => null;

export function bind<T, TFrom = any>(
    get: () => T,
    set?: (value: T) => void,
    converter?: ValueConverter<T, TFrom>,
): Binding {
    return {
        get: get,
        set: set,
        converter: converter,
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

export function prop<T = any>(prop: Partial<ComponentProp<T>>): ComponentProp<T> {
    return {
        ...prop,
        [$isComponentProp]: true,
    };
}

export type ComponentModelEventHandlers = {
    onPropChanging?: PropValueChangingHandler<PropertyKey>;
    onPropChange?: PropValueChangeHandler<PropertyKey>;
} & Record<PropertyKey, PropEventHandlers>;

export async function validate<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TProp extends KeyPath<TStruct['props']> = KeyPath<TStruct['props']>,
>(context: {
    component: Component<TStruct, TMsgHeaders>;
    def: ComponentDef<TStruct, TMsgHeaders>;
    params?: ComponentParams<TStruct>;
    path?: TProp;
}) {
    const { component, def, params, path } = context;
    const model = component.model;
    let state = model.$;

    type ValidationResults = Partial<Record<KeyPath<TStruct['props']>, ValidationResult>>;

    function mergeResults(validationResults: ValidationResults) {
        if (validationResults) {
            for (const kv of Object.entries(validationResults)) {
                const prop = kv[0];
                const entry: Mutable<ComponentPropState> = state.propState[prop] || {};
                entry.validation = (kv[1] as ValidationResult) || { isValid: true };
                runInAction(() => {
                    Reflect.set(state.propState, prop, entry);
                });
            }
        }
    }

    if (path) {
        const prop = def.props?.[path];
        if (isComponentProp(prop)) {
            const validator = prop.validator;
            if (validator?.validate) {
                const value = getByKeyPath(model, path as KeyPath<ComponentModel<TStruct>>);
                const result = await Promise.resolve(validator.validate(value));
                mergeResults({ [path]: result } as ValidationResults);
            }
        }
    } else {
        let handler = params.onValidate;
        let results = (await Promise.resolve(handler(component))) as ValidationResults;
        mergeResults(results);

        handler = def.events?.onValidate;
        results = (await Promise.resolve(handler(component))) as ValidationResults;
        mergeResults(results);

        if (def.props) {
            for (const kv of Object.entries(def.props)) {
                const path = kv[0];
                const prop = kv[1];
                if (isComponentProp(prop)) {
                    const validator = prop.validator;
                    if (validator?.validate) {
                        const value = getByKeyPath(model, path as KeyPath<ComponentModel<TStruct>>);
                        const result = await Promise.resolve(validator.validate(value));
                        mergeResults({ [path]: result } as ValidationResults);
                    }
                }
            }
        }
    }
}

export function mapToInput<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TProp extends KeyPath<TStruct['props']> = KeyPath<TStruct['props']>,
>(context: {
    component: Component<TStruct, TMsgHeaders>;
    def: ComponentDef<TStruct, TMsgHeaders>;
    params?: ComponentParams<TStruct>;
    path?: TProp;
}) {
    const { component, def, params, path } = context;

    let model = component.model;

    const onBlurFactory = (path: KeyPath<TStruct['props']>): BlurEventHandler => {
        return async (evt) => {
            const prop = def.props?.[path];
            if (isComponentProp(prop) && prop.validator?.onBlur) {
                validate({ component, def, params, path });
            }
        };
    };

    const onChangeFactory = (path: KeyPath<TStruct['props']>): ChangeEventHandler => {
        return (evt) => {
            const el = evt.target as HTMLInputElement;
            setByKeyPath(model, path as KeyPath<ComponentModel<TStruct>>, el.value as any);
        };
    };

    return {
        value: getByKeyPath(model, path as KeyPath<ComponentModel<TStruct>>) ?? '',
        onBlur: onBlurFactory(path),
        onChange: onChangeFactory(path),
    };
}

export function createModel<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(context: {
    component: Component<TStruct, TMsgHeaders>;
    def: ComponentDef<TStruct, TMsgHeaders>;
    params?: ComponentParams<TStruct>;
}) {
    const { component, def, params } = context;

    function runSafe<TFunc extends () => MaybePromise<any>>(handler: TFunc): ReturnType<TFunc> {
        return component.run(handler, true);
    }

    let model: ComponentModel<TStruct>;

    const state = {
        bindings: new Map<PropertyKey, Binding>(),
        isBusy: false,
        isDisabled: false,
        isReadOnly: false,
        isVisible: true,
        isValid: true,
        pendingRequestCount: 0,
        propState: {},
        validate: (path: KeyPath<TStruct['props']>) => {
            return validate({ component, def, params, path });
        },
    } as ComponentState;

    model = {
        $: state,
    } as Mutable<ComponentModel<TStruct>>;

    if (def.props) {
        for (const kv of Object.entries(def.props)) {
            const path = kv[0] as KeyPath<ComponentModel<TStruct>>;
            const prop = kv[1];
            let value: any;
            if (isComponentProp(prop)) {
                // keyOf<ComponentProp>('initialValue')
                if (prop.hasOwnProperty('initialValue' satisfies keyof ComponentProp)) {
                    value = prop.initialValue;
                } else {
                    continue;
                }
            } else {
                value = prop;
            }
            setByKeyPath(model, path, value);
        }
    }

    if (def.actions) {
        for (const [key, fn] of Object.entries(def.actions)) {
            Reflect.set(model, key, (...args: any[]) => component.run(() => fn(...args), false));
        }
    }

    for (const [key, value] of Object.entries(params)) {
        if (key in model) {
            if (isBinding(value)) {
                state.bindings.set(key, value);
            } else {
                Reflect.set(model, key, value);
            }
        }
    }

    const annotationMap: Record<string, any> = {};

    if (def.props) {
        for (const key of Object.keys(def.props)) {
            annotationMap[key] = observable.deep;
        }
    }

    if (def.actions) {
        for (const prop of Object.keys(def.actions)) {
            annotationMap[prop] = action;
        }
    }

    annotationMap['$'] = observable.deep;

    model = observable(model, annotationMap, {
        deep: true,
    });

    function createEventHandlers() {
        function resolveOnGetEventHandler(prop: string) {
            const key = `${$ON_GET}${capitalize(prop)}`;
            let handler = (params[key] || def.events?.[key]) as () => any;
            if (handler) {
                handler = runSafe(() => handler());
            }
            return handler;
        }

        function resolveOnChangingEventHandler(prop: string) {
            const key = `${$ON_CHANGING}${capitalize(prop)}`;
            return ((oldValue: any, newValue: any) => {
                let result = true;
                let handler = params[key] as ValueChangingHandler<any>;
                if (handler) {
                    result = runSafe(() => handler(oldValue, newValue));
                }
                if (result) {
                    handler = def.events?.[key] as ValueChangingHandler<any>;
                    if (handler) {
                        result = runSafe(() => handler(oldValue, newValue));
                    }
                }
                return result;
            }) as ValueChangingHandler;
        }

        function resolveOnChangeEventHandler(prop: string) {
            const key = `${$ON_CHANGE}${capitalize(prop)}`;
            return ((value: any) => {
                runSafe(() => (params[key] as ValueChangeHandler<any>)?.(value));
                runSafe(() => (def.events?.[key] as ValueChangeHandler<any>)?.(value));
            }) as ValueChangeHandler;
        }

        const commonHandlers: Pick<ComponentModelEventHandlers, 'onPropChanging' | 'onPropChange'> =
            {
                onPropChanging:
                    params.onPropChanging || def.events?.onPropChanging
                        ? (prop, oldValue, newValue) => {
                              let result = true;
                              let handler = params.onPropChanging;
                              if (handler) {
                                  result = runSafe(() => handler(String(prop), oldValue, newValue));
                              }
                              if (result) {
                                  handler = def.events?.onPropChanging;
                                  if (handler) {
                                      result = runSafe(() =>
                                          handler(String(prop), oldValue, newValue),
                                      );
                                  }
                              }
                              return result;
                          }
                        : undefined,
                onPropChange:
                    params.onPropChange || def.events?.onPropChange
                        ? (prop, value) => {
                              runSafe(() => params.onPropChange?.(String(prop), value));
                              runSafe(() => def.events?.onPropChange?.(String(prop), value));
                          }
                        : undefined,
            };

        const propHandlers: Record<PropertyKey, PropEventHandlers> = {};

        if (def.props) {
            for (const prop of Object.keys(def.props)) {
                propHandlers[prop] = {
                    onGet: resolveOnGetEventHandler(prop),
                    onChanging: resolveOnChangingEventHandler(prop),
                    onChange: resolveOnChangeEventHandler(prop),
                };
            }
        }

        return { ...commonHandlers, ...propHandlers } as ComponentModelEventHandlers;
    }

    const handlers = createEventHandlers();

    model = new Proxy(model, {
        get(obj, prop, receiver) {
            const onGet = handlers?.[prop]?.onGet;
            if (onGet) return onGet();

            const binding = state.bindings.get(prop);

            const value = Reflect.get(obj, prop, receiver);
            if (binding?.get) {
                return runSafe(() => binding.get());
            }

            return value;
        },

        set(obj, prop, value, receiver) {
            const oldValue = Reflect.get(obj, prop);

            // before-change hooks
            const onChanging = handlers?.[prop]?.onChanging;
            if (onChanging && onChanging(oldValue, value) === false) {
                return true;
            }

            if (
                handlers?.onPropChanging &&
                handlers.onPropChanging(prop, oldValue, value) === false
            ) {
                return true;
            }

            const result = runInAction(() => {
                return Reflect.set(obj, prop, value, receiver);
            });

            // bindings
            const binding = state.bindings.get(prop);
            if (binding?.set) {
                runSafe(() => binding?.set?.(value));
            }

            // after-change hooks
            handlers?.[prop]?.onChange?.(value);
            handlers.onPropChange?.(prop, value);

            return result;
        },
    });

    return model;
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

export function registerMsgBroker<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(component: Component<TStruct, TMsgHeaders>) {
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
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(component: Component<TStruct, TMsgHeaders>, msgBus: MsgBus<TStruct['msg'], TMsgHeaders>) {
    const headerSetter = (headers?: TMsgHeaders) => {
        if (headers && headers.sourceId == undefined) {
            headers.sourceId = component.id;
        }
    };

    type OpParams = {
        headers?: TMsgHeaders;
        options?: PromiseOptions | MsgSubOptions;
        payload?: unknown;
        callback?: Func;
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
        let abortSignal = component.abortSignal;
        if (params.options.abortSignal) {
            abortSignal = AbortSignal.any([params.options.abortSignal, abortSignal]);
        }
        params.options.abortSignal = abortSignal;
        if (params.callback) {
            const callback = params.callback;
            params.callback = (...args) => component.run(() => callback(...args), true);
        }
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
            component.model.$.pendingRequestCount++;
            return component
                .run(() => msgBus.request(getParams(params, true)), false)
                .finally(() => {
                    component.model.$.pendingRequestCount--;
                });
        },
    } as typeof component.msgBus;
}

export function createEffect<
    TStruct extends ComponentStruct<any>,
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
                        component.run(() => fn(component), false);
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

// TODO: support async resources via msgbus (TanStack Query/SWR + Suspense)
// TODO: support control persistence (with providers)
// TODO: control requestCount via msgbus (for busy state indicator)
// TODO: support asyn validation
// TODO: component type (resource-boundary/layout/UI) support
// TODO: add skeleton/not-ready state support
// TODO: visibility (visible/none/hidden) & interaction (disabled/readOnly) support (security etc) with fallback view
