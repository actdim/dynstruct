import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { bind, bindProp } from '@/componentModel/core';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

// Params semantics: plain param = initial value, binding = live channel, React props at the
// toReact / factory-child boundary stay live through bindings (debt--params-initial-value-semantics).

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

function tree(ui: React.ReactNode) {
    return <ComponentContextProvider value={{ msgBus }}>{ui}</ComponentContextProvider>;
}

afterEach(() => {
    vi.restoreAllMocks();
});

type LabelStruct = ComponentStruct<TestMsgStruct, {
    props: { label: string };
}>;

let labelInstances: Component<LabelStruct>[] = [];

const useLabel = (params: ComponentParams<LabelStruct>) => {
    let c: Component<LabelStruct>;
    let m: ComponentModel<LabelStruct>;
    const def: ComponentDef<LabelStruct> = {
        regType: 'ParamsLabel',
        props: { label: 'default' },
        events: {
            onInit: (component) => {
                labelInstances.push(component);
            },
        },
        view: () => <span data-testid="label">{m.label}</span>,
    };
    c = useComponent(def, params);
    m = c.model;

    return c;
};

const Label = toReact(useLabel);

describe('Plain params inside dynstruct are initial values', () => {
    type HostStruct = ComponentStruct<TestMsgStruct, {
        props: { text: string };
        children: { label: LabelStruct };
    }>;

    // A host that (wrongly) passes a snapshot of a render-time value as a plain param.
    const Host = ({ text }: { text: string }) => {
        let c: Component<HostStruct>;
        const def: ComponentDef<HostStruct> = {
            regType: 'ParamsHost',
            props: { text: '' },
            children: { label: useLabel({ label: text }) },
            view: () => <c.children.Label />,
        };
        c = useComponent(def, {});

        return <c.View />;
    };

    it('does not apply a changed plain param to an existing instance and warns in DEV', () => {
        labelInstances = [];
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { rerender } = render(tree(<Host text="first" />));
        expect(screen.getByTestId('label')).toHaveTextContent('first');

        rerender(tree(<Host text="second" />));
        expect(screen.getByTestId('label')).toHaveTextContent('first');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("Plain param 'label'"));
    });

    it('keeps internal edits across parent re-renders', () => {
        labelInstances = [];
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { rerender } = render(tree(<Host text="first" />));
        act(() => {
            labelInstances[0].model.label = 'edited';
        });
        rerender(tree(<Host text="first" />));
        expect(screen.getByTestId('label')).toHaveTextContent('edited');
    });

    it('follows a binding (live channel)', () => {
        type BoundHostStruct = ComponentStruct<TestMsgStruct, {
            props: { text: string };
            children: { label: LabelStruct };
        }>;
        let host: Component<BoundHostStruct> | undefined;
        const BoundHost = () => {
            let c: Component<BoundHostStruct>;
            let m: ComponentModel<BoundHostStruct>;
            const def: ComponentDef<BoundHostStruct> = {
                regType: 'ParamsBoundHost',
                props: { text: 'one' },
                children: { label: useLabel({ label: bindProp(() => m, 'text') }) },
                view: () => <c.children.Label />,
            };
            c = useComponent(def, {});
            m = c.model;
            host = c;

            return <c.View />;
        };
        render(tree(<BoundHost />));
        expect(screen.getByTestId('label')).toHaveTextContent('one');
        act(() => {
            host!.model.text = 'two';
        });
        expect(screen.getByTestId('label')).toHaveTextContent('two');
    });
});

describe('toReact props stay live through bindings', () => {
    it('follows prop changes and can return to a previously sent value', () => {
        const { rerender } = render(tree(<Label label="a" />));
        expect(screen.getByTestId('label')).toHaveTextContent('a');
        rerender(tree(<Label label="b" />));
        expect(screen.getByTestId('label')).toHaveTextContent('b');
        rerender(tree(<Label label="a" />));
        expect(screen.getByTestId('label')).toHaveTextContent('a');
    });

    it('a controlled prop is owned by the parent: an internal write is not visible and warns in DEV', () => {
        labelInstances = [];
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(tree(<Label label="parent" />));
        act(() => {
            labelInstances[0].model.label = 'internal';
        });
        expect(screen.getByTestId('label')).toHaveTextContent('parent');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("Prop 'label'"));
    });

    it('a controlled write is not stored but fires onChangeX for the parent (no warning)', () => {
        labelInstances = [];
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const onChangeLabel = vi.fn();
        render(tree(<Label label="parent" $events={{ onChangeLabel }} />));
        act(() => {
            labelInstances[0].model.label = 'internal';
        });
        expect(onChangeLabel).toHaveBeenCalledWith('internal');
        expect(screen.getByTestId('label')).toHaveTextContent('parent');
        expect(warn).not.toHaveBeenCalled();
    });

    it('undefined falls back to the default and leaves the prop to the component (uncontrolled)', () => {
        labelInstances = [];
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(tree(<Label label={undefined} />));
        expect(screen.getByTestId('label')).toHaveTextContent('default');
        act(() => {
            labelInstances[0].model.label = 'internal';
        });
        expect(screen.getByTestId('label')).toHaveTextContent('internal');
        expect(warn).not.toHaveBeenCalled();
    });

    it('does not store service params in the model', () => {
        labelInstances = [];
        render(tree(<Label label="x" $key="k1" $events={{ onReady: () => {} }} />));
        const model = labelInstances[0].model as object;
        expect(Reflect.has(model, '$events')).toBe(false);
        expect(Reflect.has(model, '$id')).toBe(false);
        expect(Reflect.has(model, '$key')).toBe(false);
    });

    it('routes errors of a callback prop replaced on later renders to onCatch', () => {
        type ActStruct = ComponentStruct<TestMsgStruct, {
            props: { onAct: () => void };
        }>;
        let instance: Component<ActStruct> | undefined;
        const onCatch = vi.fn();
        const useAct = (params: ComponentParams<ActStruct>) => {
            let c: Component<ActStruct>;
            const def: ComponentDef<ActStruct> = {
                regType: 'ParamsAct',
                props: { onAct: () => {} },
                view: () => <span>act</span>,
            };
            c = useComponent(def, params);
            instance = c;

            return c;
        };
        const Act = toReact(useAct);
        const events = { onCatch };
        const { rerender } = render(tree(<Act onAct={() => {}} $events={events} />));
        rerender(
            tree(
                <Act
                    onAct={() => {
                        throw new Error('callback failed');
                    }}
                    $events={events}
                />,
            ),
        );
        expect(() => instance!.model.onAct()).not.toThrow();
        expect(onCatch).toHaveBeenCalledTimes(1);
        expect((onCatch.mock.calls[0][0] as Error).message).toBe('callback failed');
    });
});

describe('Factory children receive live JSX props', () => {
    type ListStruct = ComponentStruct<TestMsgStruct, {
        props: { items: string[] };
        children: { card: (p: { item: string }) => LabelStruct };
    }>;

    it('a binding over the factory params follows <c.children.Card item={...} />', () => {
        let list: Component<ListStruct> | undefined;
        const List = () => {
            let c: Component<ListStruct>;
            let m: ComponentModel<ListStruct>;
            const def: ComponentDef<ListStruct> = {
                regType: 'ParamsList',
                props: { items: ['one'] },
                children: {
                    card: (p) => useLabel({ label: bind(() => p.item) }),
                },
                view: () => <c.children.Card item={m.items[0]} />,
            };
            c = useComponent(def, {});
            m = c.model;
            list = c;

            return <c.View />;
        };
        render(tree(<List />));
        expect(screen.getByTestId('label')).toHaveTextContent('one');
        act(() => {
            list!.model.items = ['two'];
        });
        expect(screen.getByTestId('label')).toHaveTextContent('two');
    });

    it('warns in DEV when a factory passes its live props whole as plain params', () => {
        type PassStruct = ComponentStruct<TestMsgStruct, {
            props: { text: string };
            children: { card: (p: { label: string }) => LabelStruct };
        }>;
        let host: Component<PassStruct> | undefined;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Pass = () => {
            let c: Component<PassStruct>;
            let m: ComponentModel<PassStruct>;
            const def: ComponentDef<PassStruct> = {
                regType: 'ParamsPass',
                props: { text: 'one' },
                children: { card: (p) => useLabel(p) },
                view: () => <c.children.Card label={m.text} />,
            };
            c = useComponent(def, {});
            m = c.model;
            host = c;

            return <c.View />;
        };
        render(tree(<Pass />));
        act(() => {
            host!.model.text = 'two';
        });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("Plain param 'label'"));
    });

    it('a React.FC fragment renders the props of the current render (no one-commit lag)', () => {
        type FragStruct = ComponentStruct<TestMsgStruct, {
            props: { n: number };
            children: { section: (p: { n: number }) => React.ReactNode };
        }>;
        const renders: number[] = [];
        const Probe = ({ n }: { n: number }) => {
            renders.push(n);

            return <span data-testid="probe">{n}</span>;
        };
        let host: Component<FragStruct> | undefined;
        const Frag = () => {
            let c: Component<FragStruct>;
            let m: ComponentModel<FragStruct>;
            const def: ComponentDef<FragStruct> = {
                regType: 'ParamsFrag',
                props: { n: 1 },
                children: { section: (p) => <Probe n={p.n} /> },
                view: () => <c.children.Section n={m.n} />,
            };
            c = useComponent(def, {});
            m = c.model;
            host = c;

            return <c.View />;
        };
        render(tree(<Frag />));
        act(() => {
            host!.model.n = 2;
        });
        expect(screen.getByTestId('probe')).toHaveTextContent('2');
        expect(renders[0]).toBe(1);
        expect(renders.slice(1).every((n) => n === 2)).toBe(true);
    });

    it('factory child props are read-only', () => {
        type RoStruct = ComponentStruct<TestMsgStruct, {
            props: { text: string };
            children: { section: (p: { text: string }) => React.ReactNode };
        }>;
        let error: unknown;
        const Ro = () => {
            let c: Component<RoStruct>;
            const def: ComponentDef<RoStruct> = {
                regType: 'ParamsRo',
                props: { text: 'x' },
                children: {
                    section: (p) => {
                        try {
                            (p as { text: string }).text = 'y';
                        } catch (err) {
                            error = err;
                        }

                        return <span>{p.text}</span>;
                    },
                },
                view: () => <c.children.Section text="x" />,
            };
            c = useComponent(def, {});

            return <c.View />;
        };
        render(tree(<Ro />));
        expect(String(error)).toContain('read-only');
    });
});
