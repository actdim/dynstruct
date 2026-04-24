import { useEffect, useLayoutEffect, useMemo, ReactNode } from 'react';
import React from 'react';
import { Func, MaybePromise, Mutable } from '@actdim/utico/typeCore';
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
    ComponentMsgHeaders,
    ComponentParams,
    ComponentRegistryContext,
    ComponentStruct,
    ComponentViewImplFn,
    ComponentViewProps,
    EffectController,
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
} from '../core';
import { ErrorBoundary } from './errorBoundary';
import { ErrorPayload, MsgBus } from '@actdim/msgmesh/contracts';
import { $ERROR } from '@/appDomain/commonContracts';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { capitalize } from '../util';

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

    let msgBus = def.msgBus || context.msgBus;

    const abortController = new AbortController();

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

    const initEffects = () => {
        if (def.effects) {
            for (const [name, fn] of Object.entries(def.effects)) {
                component.effects[name] = createEffect(
                    component,
                    name,
                    () => runSafe(fn as Func), // as EffectFn<TStruct, ComponentMsgHeaders>
                );
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
        bindings: new Map<PropertyKey, Binding>(),
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
        abortSignal: abortController.signal,
        [Symbol.dispose]: () => {
            for (const [name, fn] of Object.entries(component.effects)) {
                (fn as EffectController).stop();
            }
        },
        children: children,
        get model() {
            return model();
        },
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
    def: ComponentDef<TStruct, TMsgHeaders>,
    params: ComponentParams<TStruct>,
    internals?: TInternals,
) {
    const context = useComponentContext() as ComponentRegistryContext<TStruct['msg'], TMsgHeaders>;
    const ref = useLazyRef(() => {
        const component = createComponent<TStruct, TMsgHeaders>(
            def,
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
