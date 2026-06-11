import { useEffect, useLayoutEffect, useMemo, ReactNode } from 'react';
import React from 'react';
import { Func, Mutable } from '@actdim/utico/typeCore';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useLazyRef } from '@/reactHooks';
import { getGlobalFlags } from '@/globals';
import {
    ReactComponentContext,
    useComponentContext,
} from '@/componentModel/react/componentContext';
import {
    $isBinding,
    $isComponent,
    $SYSTEM_TOPIC,
    Component,
    ComponentChildren,
    ComponentDef,
    ComponentErrorPayload,
    ComponentImpl,
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
import { capitalize } from '../util';
import { isPlainObject } from '@actdim/utico/typeUtils';

let _lastDispatchedError: unknown;

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
): Component<TStruct, TMsgHeaders> {
    // result
    let component: Mutable<Component<TStruct, TMsgHeaders>>;

    let regType = def.regType;
    if (!regType) {
        regType = getComponentSourceByCaller(6);
        // type = getComponentNameByCaller(6);
        regType = cleanSourceRef(regType);
        // throw new Error('Valid component definition is required');
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
        try {
            result = handler();
        } catch (err) {
            return handleError(err);
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
    params = wrapUserCode(params, true) || {};

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

    const abortController = new AbortController();
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
            // const abortController = new AbortController();
            component.abortSignal = abortController.signal;
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
                // abortController.abort();
                for (const [, fn] of Object.entries(component.effects)) {
                    (fn as EffectController).stop();
                }
                def.events?.onDestroy?.(component);
                params.$events?.onDestroy?.(component);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>destroy`);
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
                    const c = view(props);
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
            abortController.abort();
        },
    };

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
) {
    const context = useComponentContext() as ComponentRegistryContext<TStruct['msg'], TMsgHeaders>;
    const ref = useLazyRef(() => {
        const component = createComponent<TStruct, TMsgHeaders>(
            def,
            context,
            params as ComponentParams<TStruct>,
        ) as ComponentImpl<TStruct, TInternals, TMsgHeaders>;
        component._ = (internals || {}) as TInternals;
        return component;
    });

    // Sync incoming params to the model on every render.
    // Needed for toReact usage: React re-renders the wrapper with new prop values
    // but the component instance (and its model) is created only once via useLazyRef.
    const c = ref.current;
    if (c && def.props) {
        runInAction(() => {
            if (params) {
                for (const [key, val] of Object.entries(params)) {
                    if (key in def.props && !isBinding(val)) {
                        const current = c.model[key];
                        if (current !== val) {
                            Reflect.set(c.model, key, val);
                        }
                    }
                }
            }
        });
    }

    useLayoutEffect(() => {
        return () => {
            ref.current[Symbol.dispose]();
            ref.current = null;
        };
    }, []); // using [] here as deps - means real unmount!
    return c;
}

export function toReact<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    factoryHook: (params: ComponentParams<TStruct>) => Component<TStruct, TMsgHeaders>,
): React.FC<ComponentParams<TStruct>> {
    const result = (params: ComponentParams<TStruct> & React.PropsWithChildren) => {
        // componentFactory
        const c = factoryHook(params);
        // return c.view();
        return <c.View {...params} />;
    };
    return result;
}
