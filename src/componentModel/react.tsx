import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Mutable } from '@actdim/utico/typeCore';
import { observer } from 'mobx-react-lite';
import { action, observable } from 'mobx';
import { useLazyRef } from '@/reactHooks';
import { getGlobalFlags } from '@/globals';
import { ReactComponentContext, useComponentContext } from './componentContext';
import {
    $isComponent,
    Binding,
    Component,
    ComponentChildren,
    ComponentDef,
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

import { $ON_CHANGE, $ON_CHANGING, $ON_GET, ComponentMsgFilter } from './contracts';
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

function capitalize(name: string) {
    return name.replace(/^./, name[0].toUpperCase());
}

function cleanSourceRef(sourceRef: string) {
    // remove origin
    return sourceRef.replace(/^[a-z][a-z0-9+.-]*:\/\/[^\/]+/, '');
}

function createComponent<
    TStruct extends ComponentStruct = ComponentStruct,
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

    if (!msgBroker.abortController) {
        msgBroker.abortController = new AbortController();
    }

    const componentMsgBus = lazy(() => {
        const globalAbortSignal = AbortSignal.any([
            component.msgBroker.abortController.signal,
            abortController.signal,
        ]);
        return getComponentMsgBus(msgBus, globalAbortSignal, (headers) => {
            if (headers && headers.sourceId == undefined) {
                headers.sourceId = component.id;
            }
        });
    });

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
                params.onLayoutReady?.(component);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-ready`);
                }
            } catch (err) {
                def.events?.onError?.(component, err);
                params.onError?.(component, err);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-error`);
                }
            }
            return () => {
                context.unregister(component.id);
                def.events?.onLayoutDestroy?.(component);
                params.onLayoutDestroy?.(component);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>layout-destroy`);
                }
            };
        }, [def, params, context]);

        useEffect(() => {
            try {
                registerMsgBroker(component);
                def.events?.onReady?.(component);
                params.onReady?.(component);
                if (getGlobalFlags().debug) {
                    // mount
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>ready`);
                }
            } catch (err) {
                def.events?.onError?.(component, err);
                params.onError?.(component, err);
                if (getGlobalFlags().debug) {
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>mount-error`);
                }
                throw err;
            }
            return () => {
                abortController?.abort();
                def.events?.onDestroy?.(component);
                params.onDestroy?.(component);
                component[Symbol.dispose]();
                if (getGlobalFlags().debug) {
                    // unmount
                    const hierarchyId = component.getHierarchyId();
                    console.debug(`${hierarchyId}>destroy`);
                }
            };
        }, [def, params, context]);

        let content: React.ReactNode;

        if (getGlobalFlags().debug) {
            // render
            const hierarchyId = component.getHierarchyId();
            console.debug(`${hierarchyId}>view`);
        }
        if (typeof view === 'function') {
            content = view(props, component);
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

    // <ErrorBoundary onError={onError}>{view(props, component)}</ErrorBoundary>
    let onError: (error: unknown, info?: unknown) => React.ReactNode = null;
    if (def.events?.onError || params.onError) {
        onError = (error, info) => {
            let result1 = def.events?.onError(component, error, info);
            let result2 = params.onError?.(component, error, info);
            return (result1 || result2) as React.ReactNode;
        };
    }
    let View = OrigView;
    if (onError || def.useErrorBoundary) {
        View = ((props) => (
            <ErrorBoundary onError={onError}>
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
                          result = handler(String(prop), oldValue, newValue);
                      }
                      if (result) {
                          handler = def.events?.onPropChanging;
                          if (handler) {
                              result = handler(String(prop), oldValue, newValue);
                          }
                      }
                      return result;
                  }
                : undefined,
        onPropChange:
            params.onPropChange || def.events?.onPropChange
                ? (prop, value) => {
                      params.onPropChange?.(String(prop), value);
                      def.events?.onPropChange?.(String(prop), value);
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
                result = handler(oldValue, newValue);
            }
            if (result) {
                handler = def.events?.[key] as ValueChangingHandler<any>;
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
            (def.events?.[key] as ValueChangeHandler<any>)?.(value);
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
        children: children,
        model: model,
        [Symbol.dispose]: () => {
            for (const [name, fn] of Object.entries(component.effects)) {
                (fn as EffectController).stop();
            }
        },
    };

    if (def.events?.onInit) {
        def.events.onInit(component);
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
    const context = useComponentContext() as ComponentRegistryContext<TStruct['msg'], TMsgHeaders>;
    const ref = useLazyRef(() =>
        createComponent<TStruct, TMsgHeaders>(componentDef, context, params),
    );
    useLayoutEffect(() => {
        return () => {
            ref.current = null;
        };
    }, []); // [params]?
    return ref.current;
}

export function toReact<TStruct extends ComponentStruct>(
    factoryHook: (params: ComponentParams<TStruct>) => Component<TStruct>,
): React.FC<ComponentParams<TStruct>> {
    const result = (params: ComponentParams<TStruct> & React.PropsWithChildren) => {
        // componentFactory
        const c = factoryHook(params);
        // return c.view();
        return <c.View {...params} />;
    };
    return result;
}

// TODO:
// do not observe props with "_", "$" prefixes
