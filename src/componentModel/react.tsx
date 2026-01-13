import React, { PropsWithChildren, useEffect, useLayoutEffect, FC, useMemo } from 'react';
import { Mutable } from '@actdim/utico/typeCore';
import { observer } from 'mobx-react-lite';
import { action, observable } from 'mobx';
import { useLazyRef } from '@/reactHooks';
import { getGlobalFlags } from '@/globals';
import { ReactComponentContext, useComponentContext } from './componentContext';
import type {
    Binding,
    Component,
    ComponentChildren,
    ComponentDef,
    ComponentModel,
    ComponentMsgHeaders,
    ComponentParams,
    ComponentStruct,
    ComponentViewImplFn,
    ComponentViewProps,
    EffectController,
    EffectFn,
    ValueChangeHandler,
    ValueChangingHandler,
} from './contracts';
import { $ON_CHANGE, $ON_CHANGING, $ON_GET, $isBinding, ComponentMsgFilter } from './contracts';
import { lazy } from '@actdim/utico/utils';
import {
    createEffect,
    createRecursiveProxy,
    getCallerFileName,
    getComponentMsgBus,
    isBinding,
    ProxyEventHandlers,
    registerMsgBroker,
    toHtmlId,
} from './core';

type ComponentSourceInfo = {
    // classId
    structId: string;
    count: 0;
};

const componentData = {
    sources: new Map<string, ComponentSourceInfo>(),
    count: 0,
};

function capitalize(name: string) {
    return name.replace(/^./, name[0].toUpperCase());
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
            // msgBus.send
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
