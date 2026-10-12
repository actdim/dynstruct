import { useEffect, useLayoutEffect, useMemo, ReactNode } from 'react';
import React from 'react';
import { Mutable } from '@actdim/utico/typeCore';
import { observer } from 'mobx-react-lite';
import { observable, runInAction } from 'mobx';
import { useLazyRef } from '@/reactHooks';
import { getGlobalFlags } from '@/globals';
import {
    ReactComponentContext,
    useComponentContext,
} from '@/componentModel/react/componentContext';
import {
    $isComponent,
    $SYSTEM_TOPIC,
    Component,
    ComponentChildren,
    ComponentDef,
    ComponentErrorPayload,
    ComponentImpl,
    ComponentMeta,
    ComponentMsgHeaders,
    ComponentParams,
    ComponentRegistryContext,
    ComponentStruct,
    ComponentViewImplFn,
    ComponentViewProps,
    EffectController,
    EffectFn,
    isBinding,
    isComponent,
} from '../contracts';

import { lazy } from '@actdim/utico/utils';
import {
    $reactProp,
    SERVICE_PARAM_KEYS,
    bind,
    createEffect,
    getComponentSourceByCaller,
    getComponentMsgBus,
    registerMsgBroker,
    toHtmlId,
    createModel,
    validate,
    mapToEdit,
} from '../core';
import { ErrorBoundary } from './errorBoundary';
import { ErrorPayload, MsgBus } from '@actdim/msgmesh/contracts';
import { $ERROR } from '@/appDomain/commonContracts';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { capitalize, isReactObject } from '../util';
import { isPlainObject } from '@actdim/utico/typeUtils';

// Error dedup within one propagation chain (see run): the last reported error and the current run nesting depth.
let _lastDispatchedError: unknown;
let _runDepth = 0;

// Internal: replaces params.$events of a created component with the latest ones.
const _eventsUpdaters = new WeakMap<Component<any, any>, (events: unknown) => void>();

// DEV: component -> param keys already reported (each warning is shown once).
const _reportedParams = new WeakMap<object, Set<string>>();

function reportOnce(target: object, key: string, message: () => string) {
    let reported = _reportedParams.get(target);
    if (!reported) {
        reported = new Set();
        _reportedParams.set(target, reported);
    }
    if (reported.has(key)) {
        return;
    }
    reported.add(key);
    console.warn(message());
}

function isPrimitive(value: unknown) {
    return value === null || (typeof value !== 'object' && typeof value !== 'function');
}

// Plain params are initial values: a plain param changed on a later render is not applied to an
// existing instance. DEV: report primitive plain params that changed (live input must be a binding).
// Objects and functions are skipped: inline literals get a new identity on every render.
function reportChangedPlainParams(
    component: Component<any, any>,
    prev: Record<string, unknown>,
    next: Record<string, unknown>,
) {
    for (const [key, val] of Object.entries(next)) {
        if (SERVICE_PARAM_KEYS.has(key)) {
            continue;
        }
        const old = prev[key];
        if (isBinding(val) || isBinding(old) || !isPrimitive(val) || !isPrimitive(old) || Object.is(val, old)) {
            continue;
        }
        reportOnce(component, key, () =>
            `[dynstruct] Plain param '${key}' of '${component.regType}' (${component.id}) changed after creation ` +
            `(${String(old)} -> ${String(val)}). Plain params are initial values and are not applied to an existing ` +
            `instance: pass a binding (bindProp / bind) for live input, or a new $key to recreate the instance.`,
        );
    }
}

/**
 * React props arrive on every render while a dynstruct instance is created once. Reads return the props of
 * the latest render (no one-commit lag in render), and touch a per-instance observable map so that observers,
 * effects and computeds re-run when a prop changes. The map (values by reference, never converted) is
 * refreshed after each commit: observable writes in the render body would trigger observer reactions while
 * another component renders.
 */
function useReactPropsBox(props: Record<string, unknown>) {
    const latest = useLazyRef(() => ({ props }));
    latest.current.props = props;
    // An observable map (not an object): values are stored as is, functions are not turned into actions.
    const box = useLazyRef(() => {
        const map = observable.map<string, unknown>(Object.entries(props), { deep: false });
        const read = (key: string) => {
            map.get(key); // tracking

            return latest.current.props[key];
        };
        const has = (key: string) => {
            map.has(key); // tracking

            return key in latest.current.props;
        };
        // Plain-object view for factory children: `p.x`, `'x' in p`, spread. Read-only.
        const view = new Proxy({} as Record<string, unknown>, {
            get: (_, key) => (typeof key === 'string' ? read(key) : undefined),
            has: (_, key) => typeof key === 'string' && has(key),
            ownKeys: () => {
                Array.from(map.keys()); // tracking

                return Object.keys(latest.current.props);
            },
            getOwnPropertyDescriptor: (_, key) =>
                typeof key === 'string' && has(key)
                    ? { value: read(key), enumerable: true, configurable: true, writable: false }
                    : undefined,
            set: (_, key) => {
                throw new Error(`[dynstruct] Factory child props are read-only (attempt to set '${String(key)}').`);
            },
            defineProperty: (_, key) => {
                throw new Error(`[dynstruct] Factory child props are read-only (attempt to define '${String(key)}').`);
            },
        });

        return { map, read, view };
    }).current;
    useLayoutEffect(() => {
        runInAction(() => {
            for (const [key, val] of Object.entries(props)) {
                if (box.map.get(key) !== val) {
                    box.map.set(key, val);
                }
            }
            for (const key of Array.from(box.map.keys())) {
                if (!(key in props)) {
                    box.map.delete(key);
                }
            }
        });
    });

    return box;
}

// regType when neither def.regType nor plugin metadata is available
const DEFAULT_REG_TYPE = 'component';

function cleanSourceRef(sourceRef: string) {
    // remove origin
    return sourceRef.replace(/^[a-z][a-z0-9+.-]*:\/\/[^\/]+/, '');
}

function createComponent<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    def: ComponentDef<TStruct, TMsgHeaders>,
    context: ComponentRegistryContext<TStruct['msg'], TMsgHeaders>,
    params?: ComponentParams<TStruct>,
    meta?: ComponentMeta,
): Component<TStruct, TMsgHeaders> {
    // result
    let component: Mutable<Component<TStruct, TMsgHeaders>>;

    // Explicit def.regType, else the name injected at build time by the dynstruct Vite plugin. Without the plugin:
    // in DEV a best-effort label from the call stack (debug only, never throws), in production a generic name.
    let regType = def.regType ?? meta?.regType;
    if (!regType) {
        // depth 6: the hook-constructor frame (useXxx -> useComponent -> useLazyRef -> factory -> createComponent)
        const source = import.meta.env.DEV ? getComponentSourceByCaller(6) : null;
        regType = source ? cleanSourceRef(source) : DEFAULT_REG_TYPE;
    }

    const view = def.view;

    let msgBus = def.msgBus || context.msgBus;

    let catching = false;
    const onError = (err: unknown) => {
        if (catching) return;
        catching = true;
        try {
            const state = component.model.$;

            state.errors.push(err);

            const src: ComponentErrorPayload['source'] = import.meta.env.DEV
                ? (component as Component)
                : component.id;

            const errPayload = {
                error: err,
                source: src,
                // properties: {}
            } satisfies ErrorPayload & {
                properties?: Record<string | number, any>;
            };

            (msgBus as MsgBus<BaseAppMsgStruct>)?.send({
                channel: $ERROR,
                topic: $SYSTEM_TOPIC,
                payload: errPayload,
                headers: {
                    sourceId: component.id,
                },
            });
            def.events?.onCatch?.(err, component);
            params.$events?.onCatch?.(err, component);
        } finally {
            catching = false;
        }
    };

    function run<TResult>(handler: () => TResult, silent = false): TResult {
        if (!handler) return undefined;

        // A run entered at depth 0 starts a new propagation chain: forget the previously reported error, so the same
        // error object thrown again later (singleton error, cached rejection) is reported again. Nested runs
        // (action -> action, effect -> action) rethrow the same error and report it once.
        if (_runDepth === 0) {
            _lastDispatchedError = undefined;
        }

        const handleError = (err: unknown) => {
            if (err !== _lastDispatchedError) {
                _lastDispatchedError = err;
                onError(err);
            }
            if (silent) {
                _lastDispatchedError = undefined;
                return undefined;
            }
            throw err;
        };

        let result: any;
        _runDepth++;
        try {
            result = handler();
        } catch (err) {
            return handleError(err);
        } finally {
            _runDepth--;
        }

        if (result instanceof Promise) {
            return result.catch(handleError) as TResult;
        }

        return result;
    }

    function wrapUserCode<T>(value: T, silent = false): T {
        if (typeof value === 'function') {
            const fn = value as (...args: unknown[]) => unknown;
            return ((...args: unknown[]) => run(() => fn(...args), silent)) as T;
        }
        // React objects (elements, portals, memo/forwardRef types, ...) are plain objects too; descending
        // into them wraps DEV internals (e.g. `_debugTask.run`, a native method that requires its receiver)
        // and breaks rendering whenever a debugger is attached.
        if (isReactObject(value)) {
            return value;
        }
        if (isPlainObject(value)) {
            const result: Record<PropertyKey, unknown> = {};
            for (const key of Reflect.ownKeys(value)) {
                Reflect.set(result, key, wrapUserCode(Reflect.get(value, key), silent));
            }
            return result as T;
        }
        return value;
    }

    def = {
        ...def,
        actions: def.actions ? wrapUserCode(def.actions, false) : undefined,
        events: def.events ? wrapUserCode(def.events, true) : undefined,
        effects: def.effects ? wrapUserCode(def.effects, true) : undefined,
        msgBroker: def.msgBroker ? wrapUserCode(def.msgBroker, false) : undefined,
        useErrorBoundary: def.useErrorBoundary == undefined ? true : def.useErrorBoundary,
    };
    let lastEvents: unknown = params?.$events;
    params = wrapUserCode(params, true) || {};

    // A React prop read through its boundary binding may be a new function on every render: keep it under
    // error routing like any other param handler (cached per function to keep the identity stable).
    for (const val of Object.values(params)) {
        if (isBinding(val) && Reflect.get(val, $reactProp)) {
            const get = val.get;
            const wrapped = new WeakMap<Function, Function>();
            val.get = () => {
                const value = get();
                if (typeof value !== 'function') {
                    return value;
                }
                let fn = wrapped.get(value);
                if (!fn) {
                    fn = wrapUserCode(value, true);
                    wrapped.set(value, fn);
                }

                return fn;
            };
        }
    }

    const updateEvents = (events: unknown) => {
        if (events === lastEvents) {
            return;
        }
        lastEvents = events;
        params.$events = wrapUserCode(events, true) as ComponentParams<TStruct>['$events'];
    };

    const initEffects = () => {
        if (def.effects) {
            for (const [name, fn] of Object.entries(def.effects)) {
                component.effects[name] = createEffect(
                    component,
                    name,
                    fn as EffectFn<TStruct, TMsgHeaders>,
                );
            }
        }
    };

    // Per-mount controller: created on (re)mount, aborted on unmount/dispose.
    // StrictMode re-runs effects, so a single creation-time controller would stay aborted.
    let abortController: AbortController | null = null;
    // number of currently mounted views of this instance (DEV guard against double mounting)
    let mountedViews = 0;
    const OrigView = observer((props: ComponentViewProps) => {
        const context = useComponentContext() as ComponentRegistryContext<
            TStruct['msg'],
            TMsgHeaders
        >;
        const parentId = context.currentId;

        component.parentId = parentId;

        if (!msgBus) {
            msgBus = context.msgBus;
        }

        if (!component.id) {
            let id = params.$id;
            if (!id) {
                const key = params.$key;
                if (key) {
                    id = `${toHtmlId(regType)}#${key}`;
                } else {
                    id = context.getNextId(regType);
                }
            }
            component.id = id;
        }

        useLayoutEffect(() => {
            // One instance has one view: a second simultaneous mount shares the id, registry entry, effects and the
            // abort controller, and the first unmount tears them down for both.
            mountedViews++;
            if (import.meta.env.DEV && mountedViews > 1) {
                console.warn(
                    `[dynstruct] The view of '${regType}' (${component.id}) is mounted more than once at the same time. ` +
                    `Render <c.children.Name /> in one place; create another instance for a second place.`,
                );
            }
            try {
                context.register(component.id, regType, parentId);
                initEffects();
                def.events?.onLayoutReady?.(component);
                params.$events?.onLayoutReady?.(component);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-ready`);
                }
            } catch (err) {
                onError(err);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-error`);
                }
            }
            return () => {
                mountedViews--;
                context.unregister(component.id);
                def.events?.onLayoutDestroy?.(component);
                params.$events?.onLayoutDestroy?.(component);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-destroy`);
                }
            };
        }, [def, params, context]);

        useEffect(() => {
            const mountAbortController = new AbortController();
            abortController = mountAbortController;
            component.abortSignal = mountAbortController.signal;
            try {
                registerMsgBroker(component);
                def.events?.onReady?.(component);
                params.$events?.onReady?.(component);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>ready`);
                }
            } catch (err) {
                onError(err);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>mount-error`);
                }
            }
            return () => {
                for (const [, fn] of Object.entries(component.effects)) {
                    (fn as EffectController).stop();
                }
                def.events?.onDestroy?.(component);
                params.$events?.onDestroy?.(component);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>destroy`);
                }
                // releases msgBroker subscriptions/providers and pending requests of this mount
                mountAbortController.abort();
                if (abortController === mountAbortController) {
                    abortController = null;
                }
            };
        }, [def, params, context]);

        let content: ReactNode;

        if (getGlobalFlags().debug) {
            // render
            const hierarchyId = component.getHierarchyId();
            console.debug(`${hierarchyId}>view`);
        }
        if (typeof view === 'function') {
            content = view(props, component) as ReactNode;
        } else {
            // Content = () => props.children;
            content = <>{props.children}</>;
        }

        const scopeContext = useMemo(
            () => ({ ...context, currentId: component.id }) as typeof context,
            [def, params, context],
        );

        return (
            <ReactComponentContext.Provider value={scopeContext}>
                {content}
            </ReactComponentContext.Provider>
        );
    });

    let View = OrigView;
    if (def.fallbackView || def.useErrorBoundary) {
        View = ((props) => (
            <ErrorBoundary
                id={() => component.id}
                onCatch={onError}
                fallback={
                    def.fallbackView && (() => def.fallbackView(props, component) as ReactNode)
                }
            >
                <OrigView {...props} />
            </ErrorBoundary>
        )) as typeof OrigView;
    }

    const children = {} as ComponentChildren<TStruct['children']>;

    if (def.children) {
        for (const [key, value] of Object.entries(def.children)) {
            if (typeof value == 'function') {
                const view = value as (params: any) => Component;
                const ChildViewFC: ComponentViewImplFn<TStruct> = observer((props) => {
                    // JSX props of a factory child arrive on every render, the child instance is created once:
                    // the factory gets a live props object, so `bind(() => p.x)` follows <c.children.X x={...} />.
                    const liveProps = useReactPropsBox(props as Record<string, unknown>).view;
                    const c = view(liveProps);
                    if (isComponent(c) && c.View) {
                        return <c.View />;
                    } else {
                        return c as any;
                    }

                    // if (typeof c.view === "function") {
                    //     return c.view(props);
                    // }
                    // return <>{props.children}</>;
                });
                Reflect.set(children, capitalize(key), ChildViewFC);
            } else {
                Reflect.set(children, key, value);
                Reflect.set(children, capitalize(key), value.View);
            }
        }
    }

    const componentMsgBus = lazy(() => getComponentMsgBus(component, msgBus));
    const model = lazy(() => createModel(component, def, params));

    component = {
        [$isComponent]: true,
        id: params.$id,
        key: params.$key,
        regType: regType,
        parentId: undefined,
        getHierarchyId: () => context.getHierarchyPath(component.id),
        getChainDown: () => context.getChainDown(component.id),
        getChainUp: () => context.getChainUp(component.id),
        getChildren: () => context.getChildren(component.id),
        getParent: () => context.getParent(component.id),
        getNodeMap: () => context.getNodeMap(),
        get msgBus() {
            return componentMsgBus();
        },
        msgBroker: {
            ...def.msgBroker,
        },
        effects: {} as Component<TStruct, TMsgHeaders>['effects'],
        // view: componentDef.view,
        View: View,
        run: run,
        abortSignal: null,
        children: children,
        get model() {
            return model();
        },
        validate: (path) => {
            return validate(component, def, params, path);
        },
        mapToEdit: (path, exclude) => {
            return mapToEdit(component, def, params, path, exclude);
        },
        [Symbol.dispose]: () => {
            abortController?.abort();
        },
    };

    _eventsUpdaters.set(component as Component<any, any>, updateEvents);

    def.events?.onInit?.(component);
    params.$events?.onInit?.(component);

    return component;
}

export function useComponent<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TInternals = unknown,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TExtStruct extends ComponentStruct<any> = TStruct,
>(
    def: ComponentDef<TStruct, TMsgHeaders>,
    params: ComponentParams<TExtStruct>,
    internals?: TInternals,
    // injected by the dynstruct Vite plugin; do not pass by hand (use def.regType)
    meta?: ComponentMeta,
) {
    const context = useComponentContext() as ComponentRegistryContext<TStruct['msg'], TMsgHeaders>;
    const ref = useLazyRef(() => {
        const component = createComponent<TStruct, TMsgHeaders>(
            def,
            context,
            params as ComponentParams<TStruct>,
            meta,
        ) as ComponentImpl<TStruct, TInternals, TMsgHeaders>;
        component._ = (internals || {}) as TInternals;
        return component;
    });

    const c = ref.current;

    // Params are applied once, at creation: plain values are initial values, bindings are live channels.
    // Later renders only refresh $events. Live React props (toReact, factory children) arrive as bindings.
    // A snapshot, not the params object: a factory child may pass the same live props object on every render.
    const prevParams = useLazyRef(() => ({ value: { ...params } as Record<string, unknown> }));
    useLayoutEffect(() => {
        if (!c || !params) {
            return;
        }
        _eventsUpdaters.get(c)?.(params.$events);
        const snapshot = { ...params } as Record<string, unknown>;
        if (import.meta.env.DEV) {
            reportChangedPlainParams(c, prevParams.current.value, snapshot);
        }
        prevParams.current.value = snapshot;
    });

    useLayoutEffect(() => {
        return () => {
            // Keep the instance: under StrictMode this cleanup is followed by a re-mount
            // of the same component, which starts a new mount lifecycle (see OrigView).
            ref.current?.[Symbol.dispose]();
        };
    }, []); // using [] here as deps - means real unmount (or StrictMode simulated one)!
    return c;
}

export function toReact<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    factoryHook: (params: ComponentParams<TStruct>) => Component<TStruct, TMsgHeaders>,
): React.FC<ComponentParams<TStruct>> {
    const ReactComponent = (props: ComponentParams<TStruct> & React.PropsWithChildren) => {
        const reactProps = props as Record<string, unknown>;
        const box = useReactPropsBox(reactProps);
        // Each React prop becomes a read-only binding over the box: it stays live without being copied into
        // the model and is owned by the React parent (controlled). Bindings passed as props are kept as is.
        const bindings = useLazyRef(() => {
            const result: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(reactProps)) {
                if (SERVICE_PARAM_KEYS.has(key)) {
                    continue;
                }
                if (isBinding(val)) {
                    result[key] = val;
                } else {
                    const binding = bind(() => box.read(key));
                    Reflect.set(binding, $reactProp, true);
                    result[key] = binding;
                }
            }

            return result;
        }).current;
        const params: Record<string, unknown> = { ...bindings };
        for (const key of SERVICE_PARAM_KEYS) {
            if (key in reactProps) {
                params[key] = reactProps[key];
            }
        }
        const c = factoryHook(params as ComponentParams<TStruct>);
        if (import.meta.env.DEV) {
            for (const key of Object.keys(reactProps)) {
                if (!SERVICE_PARAM_KEYS.has(key) && !(key in bindings)) {
                    reportOnce(c, key, () =>
                        `[dynstruct] Prop '${key}' of '${c.regType}' (${c.id}) was first passed after creation and is ` +
                        `ignored: props are bound when the component is created. Pass it from the first render ` +
                        `(undefined is fine), or a new $key to recreate the instance.`,
                    );
                }
            }
        }

        return <c.View {...props} />;
    };

    return ReactComponent;
}
