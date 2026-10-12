import { vi, describe, it, expect } from 'vitest';

// Emulate an attached debugger: React DEV captures `console.createTask` at module load and stores
// the task on every element as `_debugTask`. Its `run` must be called with the task as receiver,
// like the native ConsoleTask in Chromium with DevTools/CDP attached.
vi.hoisted(() => {
    (console as unknown as { createTask: (name: string) => unknown }).createTask = () => {
        const task = {
            run<T>(this: unknown, fn: () => T): T {
                if (this !== task) {
                    throw new Error("'run' called with illegal receiver");
                }

                return fn();
            },
        };

        return task;
    };
});

import React from 'react';
import { createPortal } from 'react-dom';
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
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct;

const msgBus = createMsgBus<TestMsgStruct>();

type SlotStruct = ComponentStruct<TestMsgStruct, {
    props: { content: React.ReactNode };
}>;

describe('useComponent - React elements in params', () => {
    it('stores React elements passed via params by reference and re-renders new ones', () => {
        const Slot = toReact((params?: ComponentParams<SlotStruct>) => {
            let c: Component<SlotStruct>;
            let m: ComponentModel<SlotStruct>;
            const def: ComponentDef<SlotStruct> = {
                regType: 'Slot',
                props: { content: undefined },
                view: () => <div>{m.content}</div>,
            };
            c = useComponent(def, params);
            m = c.model;

            return c;
        });

        const ui = (text: string) => (
            <ComponentContextProvider value={{ msgBus }}>
                <Slot content={<span data-testid="slot-content">{text}</span>} />
            </ComponentContextProvider>
        );

        const { rerender } = render(ui('hello'));
        expect(screen.getByTestId('slot-content').textContent).toBe('hello');

        rerender(ui('world'));
        expect(screen.getByTestId('slot-content').textContent).toBe('world');
    });

    it('renders an array of React elements passed via params', () => {
        const Slot = toReact((params?: ComponentParams<SlotStruct>) => {
            let c: Component<SlotStruct>;
            let m: ComponentModel<SlotStruct>;
            const def: ComponentDef<SlotStruct> = {
                regType: 'SlotList',
                props: { content: undefined },
                view: () => <div data-testid="slot-list">{m.content}</div>,
            };
            c = useComponent(def, params);
            m = c.model;

            return c;
        });

        render(
            <ComponentContextProvider value={{ msgBus }}>
                <Slot content={[<span key="a">a</span>, <span key="b">b</span>]} />
            </ComponentContextProvider>,
        );

        expect(screen.getByTestId('slot-list').textContent).toBe('ab');
    });

    it('renders a portal passed via params', () => {
        const Slot = toReact((params?: ComponentParams<SlotStruct>) => {
            let c: Component<SlotStruct>;
            let m: ComponentModel<SlotStruct>;
            const def: ComponentDef<SlotStruct> = {
                regType: 'SlotPortal',
                props: { content: undefined },
                view: () => <div>{m.content}</div>,
            };
            c = useComponent(def, params);
            m = c.model;

            return c;
        });

        const portal = createPortal(<span data-testid='portal-content'>portal</span>, document.body);
        render(
            <ComponentContextProvider value={{ msgBus }}>
                <Slot content={portal} />
            </ComponentContextProvider>,
        );

        expect(screen.getByTestId('portal-content').textContent).toBe('portal');
    });
});

type IconSlotStruct = ComponentStruct<TestMsgStruct, {
    props: { icon: React.ComponentType };
}>;

describe('useComponent - React component types in params', () => {
    const cases: [string, React.ComponentType][] = [
        ['memo', React.memo(() => <i data-testid='icon'>memo</i>)],
        ['forwardRef', React.forwardRef<HTMLElement>((_props, _ref) => <i data-testid='icon'>forwardRef</i>)],
    ];

    it.each(cases)('keeps a %s component type by reference and renders it', (name, Icon) => {
        let model: ComponentModel<IconSlotStruct> | undefined;

        const IconSlot = toReact((params?: ComponentParams<IconSlotStruct>) => {
            let c: Component<IconSlotStruct>;
            let m: ComponentModel<IconSlotStruct>;
            const def: ComponentDef<IconSlotStruct> = {
                regType: 'IconSlot',
                props: { icon: () => null },
                view: () => <m.icon />,
            };
            c = useComponent(def, params);
            m = c.model;
            model = m;

            return c;
        });

        render(
            <ComponentContextProvider value={{ msgBus }}>
                <IconSlot icon={Icon} />
            </ComponentContextProvider>,
        );

        expect(screen.getByTestId('icon').textContent).toBe(name);
        expect(model?.icon).toBe(Icon);
    });
});

type LateSlotStruct = ComponentStruct<TestMsgStruct, {
    props: { content: React.ReactNode };
}>;

describe('useComponent - reactive: ref', () => {
    it('stores a React element assigned after creation by reference and re-renders', () => {
        let model: ComponentModel<LateSlotStruct> | undefined;

        const LateSlot = toReact((params?: ComponentParams<LateSlotStruct>) => {
            let c: Component<LateSlotStruct>;
            let m: ComponentModel<LateSlotStruct>;
            const def: ComponentDef<LateSlotStruct> = {
                regType: 'LateSlot',
                props: { content: prop({ reactive: 'ref' }) },
                view: () => <div data-testid='late-slot'>{m.content}</div>,
            };
            c = useComponent(def, params);
            m = c.model;
            model = m;

            return c;
        });

        render(
            <ComponentContextProvider value={{ msgBus }}>
                <LateSlot />
            </ComponentContextProvider>,
        );
        expect(screen.getByTestId('late-slot').textContent).toBe('');

        const first = <span>first</span>;
        act(() => {
            model!.content = first;
        });
        expect(screen.getByTestId('late-slot').textContent).toBe('first');
        expect(model?.content).toBe(first);

        act(() => {
            model!.content = <span>second</span>;
        });
        expect(screen.getByTestId('late-slot').textContent).toBe('second');
    });
});

// React values are allowed only in values the model stores as is (`ref`, `false`, 'shallow' items); anywhere else a
// value stored in the model is a hard DEV error - no auto-detection (feat--react-values-in-ref-props).
// Values read through bindings (toReact props, factory-child props, bind/bindProp) are not stored and not checked.
describe('useComponent - React values only in ref props', () => {
    type ContentStruct = ComponentStruct<TestMsgStruct, {
        props: {
            content: React.ReactNode;
            slot: React.ReactNode;
            options: { label: string; icon?: React.ReactNode };
            items: { icon: React.ReactNode }[];
        };
    }>;

    let model: ComponentModel<ContentStruct> | undefined;

    const useContent = (params: ComponentParams<ContentStruct>) => {
        let c: Component<ContentStruct>;
        let m: ComponentModel<ContentStruct>;
        const def: ComponentDef<ContentStruct> = {
            regType: 'Content',
            props: {
                content: undefined,
                slot: prop({ reactive: 'ref' }),
                options: { label: '' },
                items: prop({ initialValue: [], reactive: 'shallow' }),
            },
            view: () => (
                <div data-testid='content'>
                    {m.slot}
                    {m.items.map((item, i) => (
                        <b key={i}>{item.icon}</b>
                    ))}
                </div>
            ),
        };
        c = useComponent(def, params);
        m = c.model;
        model = m;

        return c;
    };

    function renderContent(params: ComponentParams<ContentStruct>) {
        const Host = () => {
            const c = useContent(params);

            return <c.View />;
        };

        return render(
            <ComponentContextProvider value={{ msgBus }}>
                <Host />
            </ComponentContextProvider>,
        );
    }

    function silenceReactErrors() {
        return vi.spyOn(console, 'error').mockImplementation(() => {});
    }

    it('throws when a plain param stores a React element in a deep-reactive prop', () => {
        const spy = silenceReactErrors();
        expect(() => renderContent({ content: <span>x</span> })).toThrow(/Prop 'content' of 'Content' holds a React value/);
        spy.mockRestore();
    });

    it('throws for a React element nested in a deep-reactive object prop', () => {
        const spy = silenceReactErrors();
        expect(() => renderContent({ options: { label: 'a', icon: <i>i</i> } })).toThrow(/Prop 'options.icon'/);
        spy.mockRestore();
    });

    it('throws when a React element is assigned to a deep-reactive prop', () => {
        renderContent({});
        expect(() => {
            model!.content = <span>late</span>;
        }).toThrow(/holds a React value/);
    });

    it('keeps React values in a ref prop and in shallow items by reference (debugger attached)', () => {
        const slot = <span data-testid='slot'>slot</span>;
        const icon = <i data-testid='icon'>i</i>;
        renderContent({ slot, items: [{ icon }] });
        expect(model!.slot).toBe(slot);
        expect(model!.items[0].icon).toBe(icon);
        expect(screen.getByTestId('slot').textContent).toBe('slot');
        expect(screen.getByTestId('icon').textContent).toBe('i');
    });

    it('does not check values read through bindings (toReact props)', () => {
        const Content = toReact(useContent);
        render(
            <ComponentContextProvider value={{ msgBus }}>
                <Content content={<span data-testid='bound'>bound</span>} />
            </ComponentContextProvider>,
        );
        expect(isValidElementLike(model!.content)).toBe(true);
    });
});

function isValidElementLike(value: unknown) {
    return React.isValidElement(value);
}
