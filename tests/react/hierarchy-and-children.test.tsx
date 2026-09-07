import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

describe('Component Hierarchy and Context Tree', () => {
    type SimpleStruct = ComponentStruct<TestMsgStruct, {
        props: { label: string };
    }>;

    const useSimple = (params?: ComponentParams<SimpleStruct>) => {
        let c: Component<SimpleStruct>;
        let m: ComponentModel<SimpleStruct>;
        const def: ComponentDef<SimpleStruct> = {
            regType: 'SimpleNode',
            props: { label: '' },
            view: () => <div data-testid={c.id}>{m.label} ({c.id})</div>,
        };
        c = useComponent(def, params);
        m = c.model;
        return c;
    };

    it('establishes parent-child relationships and hierarchy paths', () => {
        let parentComp: Component<SimpleStruct>;
        let childComp: Component<SimpleStruct>;
        let grandChildComp: Component<SimpleStruct>;

        const GrandChild = toReact<SimpleStruct>((params) => {
            const c = useSimple(params);
            grandChildComp = c;
            return c;
        });

        const useChild = (params?: ComponentParams<SimpleStruct>) => {
            let c: Component<SimpleStruct>;
            const def: ComponentDef<SimpleStruct> = {
                regType: 'ChildNode',
                props: { label: '' },
                view: () => (
                    <div>
                        <div data-testid="child-label">Child</div>
                        <GrandChild label="Grandchild" />
                    </div>
                ),
            };
            c = useComponent(def, params);
            childComp = c;
            return c;
        };
        const Child = toReact(useChild);

        const useParent = (params?: ComponentParams<SimpleStruct>) => {
            let c: Component<SimpleStruct>;
            const def: ComponentDef<SimpleStruct> = {
                regType: 'ParentNode',
                props: { label: '' },
                view: () => (
                    <div>
                        <div data-testid="parent-label">Parent</div>
                        <Child label="Child" />
                    </div>
                ),
            };
            c = useComponent(def, params);
            parentComp = c;
            return c;
        };
        const Parent = toReact(useParent);

        wrap(<Parent label="Parent" />);

        expect(parentComp).toBeDefined();
        expect(childComp).toBeDefined();
        expect(grandChildComp).toBeDefined();

        expect(childComp.getParent()).toBe(parentComp.id);
        expect(grandChildComp.getParent()).toBe(childComp.id);

        expect(parentComp.getChildren()).toContain(childComp.id);
        expect(childComp.getChildren()).toContain(grandChildComp.id);

        expect(grandChildComp.getChainUp()).toEqual([childComp.id, parentComp.id]);
        expect(parentComp.getChainDown()).toContain(childComp.id);
        expect(parentComp.getChainDown()).toContain(grandChildComp.id);

        expect(grandChildComp.getHierarchyId()).toBe(`${parentComp.id}/${childComp.id}/${grandChildComp.id}`);
    });

    it('generates sequential IDs and supports explicit $id and $key', () => {
        let comp1: Component<SimpleStruct>;
        let comp2: Component<SimpleStruct>;
        let compKey: Component<SimpleStruct>;
        let compExplicitId: Component<SimpleStruct>;

        const Comp1 = toReact<SimpleStruct>((p) => (comp1 = useSimple(p)));
        const Comp2 = toReact<SimpleStruct>((p) => (comp2 = useSimple(p)));
        const CompKey = toReact<SimpleStruct>((p) => (compKey = useSimple(p)));
        const CompId = toReact<SimpleStruct>((p) => (compExplicitId = useSimple(p)));

        wrap(
            <div>
                <Comp1 label="first" />
                <Comp2 label="second" />
                <CompKey label="with key" $key="custom-item" />
                <CompId label="with id" $id="custom-unique-id" />
            </div>,
        );

        expect(comp1.id).toBe('SimpleNode#1');
        expect(comp2.id).toBe('SimpleNode#2');
        expect(compKey.id).toBe('SimpleNode#custom-item');
        expect(compExplicitId.id).toBe('custom-unique-id');
    });

    it('unregisters component and cleans up tree on unmount', async () => {
        type ParentUnmountStruct = ComponentStruct<TestMsgStruct, {
            props: { showChild: boolean };
            actions: {
                hideChild: () => void;
            };
        }>;

        let parentComp: Component<ParentUnmountStruct>;
        let childComp: Component<SimpleStruct>;

        const Child = toReact<SimpleStruct>((params) => {
            childComp = useSimple(params);
            return childComp;
        });

        type ParentStruct = ComponentStruct<TestMsgStruct, {
            props: { showChild: boolean };
            actions: { hideChild: () => void };
        }>;

        const useParent = (params?: ComponentParams<ParentStruct>) => {
            let c: Component<ParentStruct>;
            let m: ComponentModel<ParentStruct>;
            const def: ComponentDef<ParentStruct> = {
                regType: 'ParentUnmountNode',
                props: { showChild: true },
                actions: {
                    hideChild: () => { m.showChild = false; },
                },
                view: () => (
                    <div>
                        <button data-testid="toggle-btn" onClick={m.hideChild}>
                            Hide
                        </button>
                        {m.showChild && <Child label="Child" />}
                    </div>
                ),
            };
            c = useComponent(def, params);
            m = c.model;
            parentComp = c;
            return c;
        };
        const Parent = toReact(useParent);

        wrap(<Parent />);

        const childId = childComp.id;
        expect(parentComp.getChildren()).toContain(childId);
        expect(parentComp.getNodeMap().has(childId)).toBe(true);

        await act(async () => {
            screen.getByTestId('toggle-btn').click();
        });

        expect(parentComp.getChildren()).not.toContain(childId);
        expect(parentComp.getNodeMap().has(childId)).toBe(false);
    });
});

describe('Component Children and Slots (def.children)', () => {
    type ChildStruct = ComponentStruct<TestMsgStruct, {
        props: { title: string };
        actions: { updateTitle: (t: string) => void };
    }>;

    type ParentWithChildrenStruct = ComponentStruct<TestMsgStruct, {
        props: { count: number };
        children: {
            header: ChildStruct;
            footer: (params: { text: string }) => React.ReactNode;
        };
    }>;

    it('renders child components and functional render slots', () => {
        const useChild = (params?: ComponentParams<ChildStruct>) => {
            let c: Component<ChildStruct>;
            let m: ComponentModel<ChildStruct>;
            const def: ComponentDef<ChildStruct> = {
                regType: 'ChildCard',
                props: { title: 'Default Title' },
                actions: {
                    updateTitle: (t) => { m.title = t; },
                },
                view: () => <h3 data-testid="child-header">{m.title}</h3>,
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        };

        const useParentWithChildren = (params?: ComponentParams<ParentWithChildrenStruct>) => {
            let c: Component<ParentWithChildrenStruct>;
            let m: ComponentModel<ParentWithChildrenStruct>;
            const headerComp = useChild({ title: 'Slot Header' });

            const def: ComponentDef<ParentWithChildrenStruct> = {
                regType: 'ParentSlotContainer',
                props: { count: 0 },
                children: {
                    header: headerComp,
                    footer: (p: { text: string }) => <footer data-testid="child-footer">{p.text}</footer>,
                },
                view: () => (
                    <div>
                        <c.children.Header />
                        <div data-testid="parent-body">Body: {m.count}</div>
                        <c.children.Footer text="Slot Footer Content" />
                    </div>
                ),
            };

            c = useComponent(def, params);
            m = c.model;
            return c;
        };

        const ParentSlot = toReact(useParentWithChildren);
        wrap(<ParentSlot />);

        expect(screen.getByTestId('child-header')).toHaveTextContent('Slot Header');
        expect(screen.getByTestId('parent-body')).toHaveTextContent('Body: 0');
        expect(screen.getByTestId('child-footer')).toHaveTextContent('Slot Footer Content');
    });
});

