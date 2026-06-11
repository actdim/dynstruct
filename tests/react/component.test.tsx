import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

type TestMsgStruct = BaseAppMsgStruct<any>;

const msgBus = createMsgBus<TestMsgStruct, any>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

// ─── structs ───────────────────────────────────────────────────────────────

type CounterStruct = ComponentStruct<TestMsgStruct, {
    props: { count: number };
    actions: { increment: () => void; decrement: () => void };
}>;

type GreeterStruct = ComponentStruct<TestMsgStruct, {
    props: { name: string };
}>;

type AsyncStruct = ComponentStruct<TestMsgStruct, {
    props: { loaded: boolean; value: string };
}>;

// ─── hook constructors ─────────────────────────────────────────────────────

const useCounter = (params?: ComponentParams<CounterStruct>): Component<CounterStruct> => {
    let c: Component<CounterStruct>;
    let m: ComponentModel<CounterStruct>;

    const def: ComponentDef<CounterStruct> = {
        regType: 'Counter',
        props: { count: 0 },
        actions: {
            increment: () => { m.count += 1; },
            decrement: () => { m.count -= 1; },
        },
        view: () => (
            <div>
                <span data-testid="count">{m.count}</span>
                <button onClick={m.increment}>+</button>
                <button onClick={m.decrement}>-</button>
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

const useGreeter = (params?: ComponentParams<GreeterStruct>): Component<GreeterStruct> => {
    let c: Component<GreeterStruct>;
    let m: ComponentModel<GreeterStruct>;

    const def: ComponentDef<GreeterStruct> = {
        regType: 'Greeter',
        props: { name: '' },
        view: () => <div data-testid="greeting">Hello, {m.name}!</div>,
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

const useAsyncLoad = (params?: ComponentParams<AsyncStruct>): Component<AsyncStruct> => {
    let c: Component<AsyncStruct>;
    let m: ComponentModel<AsyncStruct>;

    const def: ComponentDef<AsyncStruct> = {
        regType: 'AsyncLoad',
        props: { loaded: false, value: '' },
        useErrorBoundary: false,
        events: {
            onReady: async () => {
                await Promise.resolve();
                m.value = 'loaded data';
                m.loaded = true;
            },
        },
        view: () => (
            <div>
                {m.loaded
                    ? <span data-testid="value">{m.value}</span>
                    : <span data-testid="loading">loading…</span>}
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

// ─── tests ─────────────────────────────────────────────────────────────────

describe('useComponent – basic render', () => {
    it('renders view', () => {
        const Counter = toReact(useCounter);
        wrap(<Counter />);
        expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('applies params as initial props', () => {
        const Greeter = toReact(useGreeter);
        wrap(<Greeter name="World" />);
        expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, World!');
    });
});

describe('useComponent – reactivity', () => {
    it('re-renders when model prop changes via action', async () => {
        const Counter = toReact(useCounter);
        wrap(<Counter />);

        await act(async () => {
            fireEvent.click(screen.getByText('+'));
        });
        expect(screen.getByTestId('count')).toHaveTextContent('1');

        await act(async () => {
            fireEvent.click(screen.getByText('+'));
        });
        expect(screen.getByTestId('count')).toHaveTextContent('2');

        await act(async () => {
            fireEvent.click(screen.getByText('-'));
        });
        expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
});

describe('useComponent – lifecycle', () => {
    it('onReady runs after mount and updates model', async () => {
        const AsyncLoad = toReact(useAsyncLoad);
        wrap(<AsyncLoad />);

        expect(screen.getByTestId('loading')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByTestId('value')).toHaveTextContent('loaded data');
        });
    });
});

describe('useComponent – model access', () => {
    it('direct model mutation updates view', async () => {
        let capturedModel: ComponentModel<CounterStruct>;

        const useCounterWithCapture = (params?: ComponentParams<CounterStruct>) => {
            const c = useCounter(params);
            capturedModel = c.model;
            return c;
        };
        const Counter = toReact(useCounterWithCapture);
        wrap(<Counter />);

        await act(async () => {
            capturedModel.count = 42;
        });
        expect(screen.getByTestId('count')).toHaveTextContent('42');
    });
});

describe('useComponent – effects', () => {
    type EffectStruct = ComponentStruct<TestMsgStruct, {
        props: { x: number; doubled: number };
        effects: 'double';
    }>;

    it('effect runs on dependency change', async () => {
        let captured: ComponentModel<EffectStruct>;

        const Comp = toReact((params?: ComponentParams<EffectStruct>) => {
            let c: Component<EffectStruct>;
            let m: ComponentModel<EffectStruct>;
            const def: ComponentDef<EffectStruct> = {
                regType: 'EffectComp',
                props: { x: 1, doubled: 0 },
                effects: {
                    double: () => { m.doubled = m.x * 2; },
                },
                view: () => <div data-testid="doubled">{m.doubled}</div>,
            };
            c = useComponent(def, params);
            m = c.model;
            captured = m;
            return c;
        });

        wrap(<Comp />);
        await waitFor(() => expect(screen.getByTestId('doubled')).toHaveTextContent('2'));

        await act(async () => { captured.x = 5; });
        expect(screen.getByTestId('doubled')).toHaveTextContent('10');
    });

    it('effect can be paused and resumed', async () => {
        let capturedC: Component<EffectStruct>;
        let capturedM: ComponentModel<EffectStruct>;

        const Comp = toReact((params?: ComponentParams<EffectStruct>) => {
            let c: Component<EffectStruct>;
            let m: ComponentModel<EffectStruct>;
            const def: ComponentDef<EffectStruct> = {
                regType: 'EffectPauseComp',
                props: { x: 1, doubled: 0 },
                effects: {
                    double: () => { m.doubled = m.x * 2; },
                },
                view: () => <div data-testid="doubled">{m.doubled}</div>,
            };
            c = useComponent(def, params);
            m = c.model;
            capturedC = c;
            capturedM = m;
            return c;
        });

        wrap(<Comp />);
        await waitFor(() => expect(screen.getByTestId('doubled')).toHaveTextContent('2'));

        await act(async () => { capturedC.effects.double.pause(); capturedM.x = 10; });
        expect(screen.getByTestId('doubled')).toHaveTextContent('2'); // unchanged

        await act(async () => { capturedC.effects.double.resume(); });
        expect(screen.getByTestId('doubled')).toHaveTextContent('20'); // runs on resume
    });
});

describe('useComponent – computed props', () => {
    type ComputedStruct = ComponentStruct<TestMsgStruct, {
        props: { firstName: string; lastName: string; readonly fullName: string };
    }>;

    it('getter prop auto-calculates from other props', async () => {
        let captured: ComponentModel<ComputedStruct>;

        const Comp = toReact((params?: ComponentParams<ComputedStruct>) => {
            let c: Component<ComputedStruct>;
            let m: ComponentModel<ComputedStruct>;
            const def: ComponentDef<ComputedStruct> = {
                regType: 'ComputedComp',
                props: {
                    firstName: 'John',
                    lastName: 'Doe',
                    get fullName() { return `${m.firstName} ${m.lastName}`.trim(); },
                },
                view: () => <div data-testid="fullname">{m.fullName}</div>,
            };
            c = useComponent(def, params);
            m = c.model;
            captured = m;
            return c;
        });

        wrap(<Comp />);
        expect(screen.getByTestId('fullname')).toHaveTextContent('John Doe');

        await act(async () => { captured.firstName = 'Jane'; });
        expect(screen.getByTestId('fullname')).toHaveTextContent('Jane Doe');
    });
});

describe('useComponent – property events', () => {
    type PropEvtStruct = ComponentStruct<TestMsgStruct, {
        props: { value: string };
        actions: { setValue: (v: string) => void };
    }>;

    it('onChangeX fires after prop changes', async () => {
        const spy = vi.fn();

        const Comp = toReact((params?: ComponentParams<PropEvtStruct>) => {
            let c: Component<PropEvtStruct>;
            let m: ComponentModel<PropEvtStruct>;
            const def: ComponentDef<PropEvtStruct> = {
                regType: 'PropEvtComp',
                props: { value: '' },
                actions: { setValue: (v) => { m.value = v; } },
                events: {
                    onChangeValue: (v) => spy(v),
                },
                view: () => (
                    <button data-testid="btn" onClick={() => m.setValue('hello')}>set</button>
                ),
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        });

        wrap(<Comp />);
        await act(async () => { fireEvent.click(screen.getByTestId('btn')); });
        expect(spy).toHaveBeenCalledWith('hello');
    });

    it('onChangingX returning false cancels the change', async () => {
        let captured: ComponentModel<PropEvtStruct>;

        const Comp = toReact((params?: ComponentParams<PropEvtStruct>) => {
            let c: Component<PropEvtStruct>;
            let m: ComponentModel<PropEvtStruct>;
            const def: ComponentDef<PropEvtStruct> = {
                regType: 'CancelComp',
                props: { value: 'initial' },
                actions: { setValue: (v) => { m.value = v; } },
                events: {
                    onChangingValue: () => false, // always cancel
                },
                view: () => <div data-testid="val">{m.value}</div>,
            };
            c = useComponent(def, params);
            m = c.model;
            captured = m;
            return c;
        });

        wrap(<Comp />);
        await act(async () => { captured.value = 'changed'; });
        expect(screen.getByTestId('val')).toHaveTextContent('initial');
    });
});

describe('useComponent – proxy toJSON', () => {
    type ProxyStruct = ComponentStruct<TestMsgStruct, {
        props: {
            user: { name: string; age: number };
            tags: string[];
        };
    }>;

    it('nested object serializes via JSON.stringify without toPlain', async () => {
        let captured: ComponentModel<ProxyStruct>;

        const Comp = toReact((params?: ComponentParams<ProxyStruct>) => {
            let c: Component<ProxyStruct>;
            let m: ComponentModel<ProxyStruct>;
            const def: ComponentDef<ProxyStruct> = {
                regType: 'ProxyComp',
                props: { user: { name: 'Alice', age: 30 }, tags: ['a', 'b'] },
                view: () => <div />,
            };
            c = useComponent(def, params);
            m = c.model;
            captured = m;
            return c;
        });

        wrap(<Comp />);

        expect(JSON.parse(JSON.stringify(captured.user))).toEqual({ name: 'Alice', age: 30 });
        expect(JSON.parse(JSON.stringify(captured.tags))).toEqual(['a', 'b']);
        expect(JSON.parse(JSON.stringify(captured))).toMatchObject({ user: { name: 'Alice', age: 30 }, tags: ['a', 'b'] });
    });
});

describe('useComponent – onCatch', () => {
    it('routes action errors to onCatch', async () => {
        type ErrStruct = ComponentStruct<TestMsgStruct, {
            props: { caught: string };
            actions: { fail: () => void };
        }>;

        const onCatchSpy = vi.fn();

        const Comp = toReact((params?: ComponentParams<ErrStruct>) => {
            let c: Component<ErrStruct>;
            let m: ComponentModel<ErrStruct>;
            const def: ComponentDef<ErrStruct> = {
                regType: 'ErrComp',
                props: { caught: '' },
                useErrorBoundary: false,
                actions: { fail: () => { throw new Error('boom'); } },
                events: {
                    onCatch: (err) => {
                        onCatchSpy(err);
                        m.caught = (err as Error).message;
                    },
                },
                view: () => (
                    <div>
                        <button data-testid="fail-btn" onClick={m.fail}>fail</button>
                        <span data-testid="caught">{m.caught}</span>
                    </div>
                ),
            };
            c = useComponent(def, params);
            m = c.model;
            return c;
        });

        wrap(<Comp />);

        await act(async () => {
            fireEvent.click(screen.getByTestId('fail-btn'));
        });

        expect(onCatchSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
        expect(screen.getByTestId('caught')).toHaveTextContent('boom');
    });
});
