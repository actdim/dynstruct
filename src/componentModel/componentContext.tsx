//##############################################################################
//# Copyright (c) Pavel Borodaev                                               #
//##############################################################################

import React, { createContext, PropsWithChildren, useContext, useRef } from 'react';
import {
    BaseComponentContext,    
    ComponentRegistryContext,
    ComponentTreeNode,
} from './contracts';

export const ReactComponentContext = createContext<ComponentRegistryContext>(undefined);

// ComponentRegistry(Context)Provider
export function ComponentContextProvider(
    props: PropsWithChildren<{
        value?: BaseComponentContext;
    }>,
) {
    let context: React.RefObject<ComponentRegistryContext>;
    const treeRef = useRef(new Map<string, ComponentTreeNode>());
    // idStack
    const regStack = useRef([]);

    const getCurrentId = () => {
        return regStack.current[regStack.current.length - 1];
    };

    const register = (id: string, regType: string, parentId?: string) => {
        let node = treeRef.current.get(id);

        if (!node) {
            node = {
                id,
                parentId,
                children: new Set(),
                regType: regType,
            };
            treeRef.current.set(id, node);
        } else {
            node.parentId = parentId;
            node.regType = regType;
        }

        if (parentId) {
            let parentNode = treeRef.current.get(parentId);
            if (!parentNode) {
                parentNode = {
                    id: parentId,
                    children: new Set(),
                    regType: undefined,
                };
                treeRef.current.set(parentId, parentNode);
            }
            if (!parentNode.children.has(id)) {
                parentNode.children.add(id);
            }
        }

        regStack.current.push(id);
    };

    const unregister = (id: string) => {
        const node = treeRef.current.get(id);
        if (!node) {
            return;
        }

        if (node.parentId) {
            const parent = treeRef.current.get(node.parentId);
            parent?.children.delete(id);
        }

        node.children.forEach((childId) => unregister(childId));
        treeRef.current.delete(id);

        const index = regStack.current.lastIndexOf(id);
        if (index >= 0) {
            regStack.current.splice(index, 1);
        }
    };

    const getParent = (id: string) => {
        return treeRef.current.get(id)?.parentId;
    };
    const getChildren = (id: string) => {
        return Array.from(treeRef.current.get(id)?.children ?? []) as string[];
    };

    const getChainUp = (id: string): string[] => {
        const result: string[] = [];
        let current = id;
        while (true) {
            const parent = getParent(current);
            if (!parent) {
                break;
            }
            result.push(parent);
            current = parent;
        }
        return result;
    };

    const getRootId = (id: string) => {
        let current = id;
        while (true) {
            const parent = getParent(current);
            if (!parent) {
                break;
            }
            current = parent;
        }
        return current;
    };

    const getChainDown = (id: string): string[] => {
        const result: string[] = [];
        const stack: string[] = [id];
        while (stack.length > 0) {
            const current = stack.pop();
            const children = getChildren(current)!;
            for (const child of children) {
                if (!result.includes(child)) {
                    result.push(child);
                    stack.push(child);
                }
            }
            // result.push(...children);
            // stack.push(...children);
        }
        return result;
    };

    const getHierarchy = (rootId: string) => {
        const buildNode = (id: string): ComponentTreeNode => {
            const childIds = getChildren(id) || [];
            return {
                id,
                parentId: getParent(id),
                children: childIds.map(buildNode),
            } as ComponentTreeNode & { children: ComponentTreeNode[] };
        };
        return buildNode(rootId);
    };

    const getSiblings = (id: string) => {
        const parent = getParent(id);
        if (!parent) {
            return [];
        }
        const children = getChildren(parent);
        if (!children) {
            return [];
        }
        return children.filter((child) => child !== id);
    };

    const getHierarchyPath = (id: string): string => {
        if (!id) {
            id = getCurrentId();
        }
        const path: string[] = [];
        let current = id;

        while (current) {
            path.push(current);
            current = getParent(current);
        }

        return path.reverse().join('/');
    };

    // getNodes
    const getNodeMap = () => treeRef.current;

    context = useRef({
        ...props.value,
        register,
        unregister,
        getParent,
        getChildren,
        getChainUp,
        getChainDown,
        getHierarchyPath,
        getNodeMap,
    });

    return (
        <ReactComponentContext.Provider value={context.current}>
            {props.children}
        </ReactComponentContext.Provider>
    );
}

// useComponentRegistry(Context)
export function useComponentContext() {
    const context = useContext(ReactComponentContext);
    if (!context) {
        // useComponentContext must be used within a ComponentContextProvider
        throw new Error(
            "Can't resolve ComponentContext. Please wrap your component tree with <ComponentContextProvider>.",
        );
    }
    return context;
}
