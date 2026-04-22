import { useEffect, useLayoutEffect, useMemo, useRef, ReactNode, useCallback } from 'react';
import React from 'react';
import { MaybePromise, Mutable } from '@actdim/utico/typeCore';
import { observer } from 'mobx-react-lite';
import { action, observable } from 'mobx';
import { useLazyRef } from '@/reactHooks';
import { getGlobalFlags } from '@/globals';
import {
    ReactComponentContext,
    useComponentContext,
} from '@/componentModel/react/componentContext';
import {
    $isComponent,
    $SYSTEM_TOPIC,
    Binding,
    Component,
    ComponentChildren,
    ComponentDef,
    ComponentImpl,
    ComponentModel,
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
    ValueChangeHandler,
    ValueChangingHandler,
} from './contracts';

import { $ON_CHANGE, $ON_CHANGING, $ON_GET } from './contracts';
import { lazy } from '@actdim/utico/utils';
import {
    createEffect,
    createRecursiveProxy,
    getComponentSourceByCaller,
    getComponentMsgBus,
    ProxyEventHandlers,
    registerMsgBroker,
    toHtmlId,
} from './core';
import { ErrorBoundary } from './react/errorBoundary';
import { ErrorPayload, MsgBus } from '@actdim/msgmesh/contracts';
import { $ERROR } from '@/appDomain/commonContracts';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

function capitalize(name: string) {
    return name.replace(/^./, name[0].toUpperCase());
}

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

    let model: Mutable<ComponentModel<TStruct>>;

    if (!def) {
        def = {};
    }

    if (def.useErrorBoundary == undefined) {
        def.useErrorBoundary = true;
    }

    let regType = def.regType;
    if (!regType) {
        regType = getComponentSourceByCaller(6);
        // type = getComponentNameByCaller(6);
        regType = cleanSourceRef(regType);
        // throw new Error('Valid component definition is required');
    }

    if (!params) {
        params = {};
    }

    const view = def.view;
    
    let msgBus = def.msgBus;

    const bindings = new Map<PropertyKey, Binding>();

    const abortController = new AbortController();

    let msgBroker = {
        ...def.msgBroker,
    };

    const initEffects = () => {
        if (def.effects) {
            for (const [name, fn] of Object.entries(def.effects)) {
                try {
                    component.effects[name] = createEffect(
                        component,
                        name,
                        fn as EffectFn<TStruct, ComponentMsgHeaders>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }
        }
    };

    const onError = (err: unknown) => {
        const src = import.meta.env.DEV
            ? {
                  component: component,
              }
            : {
                  component: {
                      id: component.id,
                      hierarchyId: component.getHierarchyId(),
                  },
              };

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
        });
        def.events?.onCatch?.(component, err);
        params.onCatch?.(component, err);
    };

    function run<TFunc extends () => MaybePromise<any>>(
        handler: TFunc,
        silent = false,
    ): ReturnType<TFunc> {
        if (!handler) return undefined;

        const handleError = (err: unknown) => {
            onError?.(err);
            if (silent) {
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
            return result.catch(handleError) as ReturnType<TFunc>;
        }

        return result;
    }

    function runSafe<TFunc extends () => MaybePromise<any>>(handler: TFunc): ReturnType<TFunc> {
        return run(handler, true);
    }

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
                runSafe(() => def.events?.onLayoutReady?.(component));
                runSafe(() => params.onLayoutReady?.(component));
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
                runSafe(() => def.events?.onLayoutDestroy?.(component));
                runSafe(() => params.onLayoutDestroy?.(component));
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-destroy`);
                }
            };
        }, [def, params, context]);

        useEffect(() => {
            try {
                registerMsgBroker(component);
                runSafe(() => def.events?.onReady?.(component));
                runSafe(() => params.onReady?.(component));
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
                abortController?.abort();
                runSafe(() => def.events?.onDestroy?.(component));
                runSafe(() => params.onDestroy?.(component));
                component[Symbol.dispose]();
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
            () => ({ ...context, currentId: component.id }),
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

    model = {} as Mutable<ComponentModel<TStruct>>;

    if (def.props) {
        Object.assign(model, def.props);
    }

    if (def.actions) {
        Object.assign(model, def.actions);
    }

    if (def.children) {
        for (const [key, value] of Object.entries(def.children)) {
            if (typeof value == 'function') {
                const view = value as (params: any) => Component;
                const ChildViewFC: ComponentViewImplFn<TStruct> = (props) => {
                    const c = view(props);
                    if (isComponent(c) && c.View) {
                        return <c.View />;
                    } else {
                        return c;
                    }

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
                              result = runSafe(() => handler(String(prop), oldValue, newValue));
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

    function resolveOnGetEventHandler(prop: string) {
        const key = `${$ON_GET}${capitalize(prop)}`;
        return params[key] || def.events?.[key];
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

    let annotationMap: Record<string, any> = {};

    if (def.props) {
        for (const prop of Object.keys(def.props)) {
            proxyEventHandlers[prop] = {
                onGet: resolveOnGetEventHandler(prop),
                onChanging: resolveOnChangingEventHandler(prop),
                onChange: resolveOnChangeEventHandler(prop),
            };
        }

        for (const key of Object.keys(def.props)) {
            annotationMap[key] = observable.deep;
        }
    }

    if (def.actions) {
        const annotationMap: Record<string, any> = {};
        for (const key of Object.keys(def.actions)) {
            annotationMap[key] = action;
        }
    }

    model = observable(model, annotationMap, {
        deep: true,
    });

    model = createRecursiveProxy(model, bindings, proxyEventHandlers);

    const componentMsgBus = lazy(() => getComponentMsgBus(component, msgBus));

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
        bindings: bindings,
        get msgBus() {
            return componentMsgBus();
        },
        msgBroker: msgBroker,
        effects: {} as Component<TStruct, TMsgHeaders>['effects'],
        // view: componentDef.view,
        View: View,
        run: run,
        abortSignal: abortController.signal,
        [Symbol.dispose]: () => {
            for (const [name, fn] of Object.entries(component.effects)) {
                (fn as EffectController).stop();
            }
        },
        children: children,
        model: model,
    };

    runSafe(() => def.events?.onInit?.(component));
    runSafe(() => params.onInit?.(component));

    return component;
}

export function useComponent<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TInternals = unknown,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    componentDef: ComponentDef<TStruct, TMsgHeaders>,
    params: ComponentParams<TStruct>,
    internals?: TInternals,
) {
    const context = useComponentContext() as ComponentRegistryContext<TStruct['msg'], TMsgHeaders>;
    const ref = useLazyRef(() => {
        const component = createComponent<TStruct, TMsgHeaders>(
            componentDef,
            context,
            params,
        ) as ComponentImpl<TStruct, TInternals, TMsgHeaders>;
        component.internals = internals;
        return component;
    });
    useLayoutEffect(() => {
        return () => {
            ref.current = null;
        };
    }, []); // [params]?
    return ref.current;
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
