import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { prop } from '@/componentModel/core';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct<any>;
const msgBus = createMsgBus<TestMsgStruct, any>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

describe('Deep Object and Array Reactivity', () => {
    type DeepStruct = ComponentStruct<TestMsgStruct, {
        props: {
            user: {
                profile: {
                    city: string;
                    age: number;
                };
            };
            items: { id: number; title: string }[];
        };
        actions: {
            setCity: (city: string) => void;
            addItem: (item: { id: number; title: string }) => void;
            updateFirstItem: (title: string) => void;
            removeItem: (index: number) => void;
        };
    }>;

    const useDeep = (params?: ComponentParams<DeepStruct>) => {
        let c: Component<DeepStruct>;
        let m: ComponentModel<DeepStruct>;
        const def: ComponentDef<DeepStruct> = {
            regType: 'DeepComp',
            props: {
                user: {
                    profile: {
                        city: 'Berlin',
                        age: 28,
                    },
                },
                items: [
                    { id: 1, title: 'First' },
                    { id: 2, title: 'Second' },
                ],
            },
            actions: {
                setCity: (city) => { m.user.profile.city = city; },
                addItem: (item) => { m.items.push(item); },
                updateFirstItem: (title) => { m.items[0].title = title; },
                removeItem: (index) => { m.items.splice(index, 1); },
            },
            view: () => (
                <div>
                    <span data-testid="user-city">{m.user.profile.city}</span>
                    <ul data-testid="item-list">
                        {m.items.map((it) => (
                            <li key={it.id} data-testid={`item-${it.id}`}>
                                {it.title}
                            </li>
                        ))}
                    </ul>
                </div>
            ),
        };
        c = useComponent(def, params);
        m = c.model;
        return c;
    };

    it('tracks deep nested property mutations and re-renders view', async () => {
        let captured: ComponentModel<DeepStruct>;
        const DeepView = toReact<DeepStruct>((p) => {
            const c = useDeep(p);
            captured = c.model;
            return c;
        });

        wrap(<DeepView />);
        expect(screen.getByTestId('user-city')).toHaveTextContent('Berlin');

        await act(async () => {
            captured.setCity('Munich');
        });
        expect(screen.getByTestId('user-city')).toHaveTextContent('Munich');

        await act(async () => {
            captured.user.profile.city = 'Hamburg';
        });
        expect(screen.getByTestId('user-city')).toHaveTextContent('Hamburg');
    });

    it('tracks array push, splice, and in-place item edits', async () => {
        let captured: ComponentModel<DeepStruct>;
        const DeepView = toReact<DeepStruct>((p) => {
            const c = useDeep(p);
            captured = c.model;
            return c;
        });

        wrap(<DeepView />);
        expect(screen.getByTestId('item-1')).toHaveTextContent('First');
        expect(screen.getByTestId('item-2')).toHaveTextContent('Second');

        await act(async () => {
            captured.addItem({ id: 3, title: 'Third' });
        });
        expect(screen.getByTestId('item-3')).toHaveTextContent('Third');

        await act(async () => {
            captured.updateFirstItem('Updated First');
        });
        expect(screen.getByTestId('item-1')).toHaveTextContent('Updated First');

        await act(async () => {
            captured.removeItem(1);
        });
        expect(screen.queryByTestId('item-2')).not.toBeInTheDocument();
    });
});

describe('Reactivity Controls (prop reactive options)', () => {
    type NonReactiveStruct = ComponentStruct<TestMsgStruct, {
        props: {
            staticData: { count: number };
            reactiveCount: number;
        };
        actions: {
            incStatic: () => void;
            incReactive: () => void;
        };
    }>;

    it('respects prop({ reactive: false }) and does not re-render on mutation', async () => {
        let captured: ComponentModel<NonReactiveStruct>;
        let renderCount = 0;

        const useNonReactive = (params?: ComponentParams<NonReactiveStruct>) => {
            let c: Component<NonReactiveStruct>;
            let m: ComponentModel<NonReactiveStruct>;
            const def: ComponentDef<NonReactiveStruct> = {
                regType: 'NonReactiveComp',
                props: {
                    staticData: prop({ initialValue: { count: 0 }, reactive: false }),
                    reactiveCount: 0,
                },
                actions: {
                    incStatic: () => { m.staticData.count += 1; },
                    incReactive: () => { m.reactiveCount += 1; },
                },
                view: () => {
                    renderCount++;
                    return (
                        <div>
                            <span data-testid="static-val">{m.staticData.count}</span>
                            <span data-testid="reactive-val">{m.reactiveCount}</span>
                        </div>
                    );
                },
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        };

        const NonReactiveView = toReact<NonReactiveStruct>((p) => {
            const c = useNonReactive(p);
            captured = c.model;
            return c;
        });

        wrap(<NonReactiveView />);
        expect(screen.getByTestId('static-val')).toHaveTextContent('0');
        expect(renderCount).toBe(1);

        await act(async () => {
            captured.incStatic();
        });
        expect(captured.staticData.count).toBe(1);
        expect(renderCount).toBe(1);

        await act(async () => {
            captured.incReactive();
        });
        expect(renderCount).toBe(2);
        expect(screen.getByTestId('reactive-val')).toHaveTextContent('1');
        expect(screen.getByTestId('static-val')).toHaveTextContent('1');
    });
});

describe('Global and Custom Property Hooks (onPropChanging, onPropChange, onGet)', () => {
    type HooksStruct = ComponentStruct<TestMsgStruct, {
        props: {
            first: string;
            second: string;
            readonly greeting: string;
        };
    }>;

    it('intercepts and can cancel changes with onPropChanging', async () => {
        let captured: ComponentModel<HooksStruct>;
        const changingSpy = vi.fn((propName: PropertyKey, oldVal: any, newVal: any) => {
            if (propName === 'first' && newVal === 'forbidden') {
                return false;
            }
            return true;
        });
        const changeSpy = vi.fn();

        const useHooksComp = (params?: ComponentParams<HooksStruct>) => {
            let c: Component<HooksStruct>;
            let m: ComponentModel<HooksStruct>;
            const def: ComponentDef<HooksStruct> = {
                regType: 'PropHooksComp',
                props: {
                    first: 'initial1',
                    second: 'initial2',
                    get greeting() { return `Hi ${m.first}`; },
                },
                events: {
                    onPropChanging: (p, oldVal, newVal) => changingSpy(p, oldVal, newVal),
                    onPropChange: (p, val) => changeSpy(p, val),
                },
                view: () => (
                    <div>
                        <span data-testid="first">{m.first}</span>
                        <span data-testid="second">{m.second}</span>
                        <span data-testid="greeting">{m.greeting}</span>
                    </div>
                ),
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        };

        const HooksView = toReact<HooksStruct>((p) => {
            const c = useHooksComp(p);
            captured = c.model;
            return c;
        });

        wrap(<HooksView />);

        await act(async () => {
            captured.first = 'allowed';
        });
        expect(screen.getByTestId('first')).toHaveTextContent('allowed');
        expect(screen.getByTestId('greeting')).toHaveTextContent('Hi allowed');
        expect(changingSpy).toHaveBeenCalledWith('first', 'initial1', 'allowed');
        expect(changeSpy).toHaveBeenCalledWith('first', 'allowed');

        await act(async () => {
            captured.first = 'forbidden';
        });
        expect(screen.getByTestId('first')).toHaveTextContent('allowed');
        expect(screen.getByTestId('greeting')).toHaveTextContent('Hi allowed');
    });
});

