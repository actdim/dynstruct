import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { bindField, fromExternalStore, prop } from '@/componentModel/core';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
    ValidationContext,
    ValidationResult,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

function wrap(ui: React.ReactNode) {
    return render(
        <ComponentContextProvider value={{ msgBus }}>
            {ui}
        </ComponentContextProvider>,
    );
}

/** Mounts a component built from `build` and returns its instance. */
function mountComp<S extends ComponentStruct<any>>(build: (getC: () => Component<S>) => ComponentDef<S>): Component<S> {
    let comp!: Component<S>;
    const View = toReact<S>((p: ComponentParams<S>) => {
        const def = build(() => comp);
        comp = useComponent(def, p);

        return comp;
    });
    wrap(<View />);

    return comp;
}

const required = (message: ValidationResult['message'] = 'Required') => (v: string) =>
    v ? undefined : { isValid: false, message };

type NameStruct = ComponentStruct<TestMsgStruct, { props: { name: string } }>;

describe('Validation ergonomics', () => {
    it('passes ctx to validators', async () => {
        type S = ComponentStruct<TestMsgStruct, { props: { email: string; confirm: string } }>;
        const seen: ValidationContext[] = [];
        const comp = mountComp<S>(() => ({
            regType: 'CtxComp',
            props: {
                email: 'a@b.c',
                confirm: prop({
                    initialValue: 'x@y.z',
                    validator: {
                        validate: (v: string, ctx) => {
                            seen.push(ctx);

                            return v === ctx.model.email ? undefined : { isValid: false, message: 'Mismatch' };
                        },
                    },
                }),
            },
            view: () => <span />,
        }));

        let ok = true;
        await act(async () => {
            ok = await comp.validate('confirm');
        });
        expect(ok).toBe(false);
        const last = seen[seen.length - 1];
        expect(last?.path).toBe('confirm');
        expect(last?.trigger).toBe('manual');
        expect(last?.component).toBe(comp);
        expect(comp.model.$.propState['confirm']?.error).toBe('Mismatch');
    });

    it('validate() resolves false while a field is invalid and true after fixing it', async () => {
        const comp = mountComp<NameStruct>(() => ({
            regType: 'ValidateResultComp',
            props: { name: prop({ initialValue: '', validator: { validate: required() } }) },
            view: () => <span />,
        }));

        let ok = true;
        await act(async () => {
            ok = await comp.validate();
        });
        expect(ok).toBe(false);
        expect(comp.model.$.propState['name']?.visibleError).toBe('Required');
        expect(comp.model.$.isValid).toBe(false);

        await act(async () => {
            comp.model.name = 'Ann';
            ok = await comp.validate();
        });
        expect(ok).toBe(true);
        expect(comp.model.$.isValid).toBe(true);
    });

    it('visibleError waits for touch', async () => {
        const comp = mountComp<NameStruct>(() => ({
            regType: 'TouchComp',
            props: { name: prop({ initialValue: 'x', validator: { validate: required() } }) },
            view: () => <span />,
        }));

        await act(async () => {
            comp.model.name = '';
        });
        await waitFor(() => expect(comp.model.$.propState['name']?.error).toBe('Required'));
        expect(comp.model.$.propState['name']?.visibleError).toBeUndefined();
        expect(comp.model.$.propState['name']?.touched).toBe(false);

        await act(async () => {
            await comp.touch('name');
        });
        expect(comp.model.$.propState['name']?.visibleError).toBe('Required');
    });

    it('touch shows the error of a never-edited required field', async () => {
        const comp = mountComp<NameStruct>(() => ({
            regType: 'TouchUneditedComp',
            props: { name: prop({ initialValue: '', validator: { validate: required() } }) },
            view: () => <span />,
        }));

        expect(comp.model.$.propState['name']).toBeUndefined();
        await act(async () => {
            await comp.touch('name');
        });
        expect(comp.model.$.propState['name']?.visibleError).toBe('Required');
    });

    it('setValidation shows a server error and an edit clears it', async () => {
        const comp = mountComp<NameStruct>(() => ({
            regType: 'ServerErrorComp',
            props: { name: prop({ initialValue: 'taken', validator: { validate: required() } }) },
            view: () => <span />,
        }));

        act(() => {
            comp.setValidation({ name: { isValid: false, message: 'Taken', code: 'SLUG_CONFLICT' } });
        });
        expect(comp.model.$.propState['name']?.visibleError).toBe('Taken');
        expect(comp.model.$.propState['name']?.validation?.code).toBe('SLUG_CONFLICT');
        expect(comp.model.$.isValid).toBe(false);

        await act(async () => {
            comp.model.name = 'free';
        });
        await waitFor(() => expect(comp.model.$.propState['name']?.validation?.isValid).toBe(true));
        expect(comp.model.$.propState['name']?.visibleError).toBeUndefined();
        expect(comp.model.$.isValid).toBe(true);
    });

    it('resetValidation clears one path or all', async () => {
        type S = ComponentStruct<TestMsgStruct, { props: { a: string; b: string } }>;
        const comp = mountComp<S>(() => ({
            regType: 'ResetComp',
            props: {
                a: prop({ initialValue: '', validator: { validate: required('A') } }),
                b: prop({ initialValue: '', validator: { validate: required('B') } }),
            },
            view: () => <span />,
        }));

        await act(async () => {
            await comp.validate();
        });
        expect(comp.model.$.propState['a']?.visibleError).toBe('A');
        expect(comp.model.$.propState['b']?.visibleError).toBe('B');

        act(() => {
            comp.resetValidation('a');
        });
        expect(comp.model.$.propState['a']?.error).toBeUndefined();
        expect(comp.model.$.propState['a']?.touched).toBe(false);
        expect(comp.model.$.propState['b']?.visibleError).toBe('B');
        expect(comp.model.$.isValid).toBe(false);

        act(() => {
            comp.resetValidation();
        });
        expect(comp.model.$.propState['b']?.error).toBeUndefined();
        expect(comp.model.$.isValid).toBe(true);
    });

    it('function message is resolved on read', async () => {
        const texts = { current: 'Required' };
        const comp = mountComp<NameStruct>(() => ({
            regType: 'LazyMessageComp',
            props: {
                name: prop({ initialValue: '', validator: { validate: required(() => texts.current) } }),
            },
            view: () => <span />,
        }));

        await act(async () => {
            await comp.validate('name');
        });
        expect(comp.model.$.propState['name']?.error).toBe('Required');
        texts.current = 'Obligatorio';
        // a plain object is not observable, so read the message through a fresh result read
        expect(comp.model.$.propState['name']?.validation?.message).toBeTypeOf('function');
        const msg = comp.model.$.propState['name']?.validation?.message;
        expect(typeof msg === 'function' ? msg() : msg).toBe('Obligatorio');
    });

    it('function message re-renders when its external source changes (i18n case)', async () => {
        let locale = 'en';
        const listeners = new Set<() => void>();
        const readLocale = fromExternalStore(
            (onChange) => {
                listeners.add(onChange);

                return () => listeners.delete(onChange);
            },
            () => locale,
        );
        const comp = mountComp<NameStruct>((getC) => ({
            regType: 'ReactiveMessageComp',
            props: {
                name: prop({
                    initialValue: '',
                    validator: { validate: required(() => (readLocale() === 'en' ? 'Required' : 'Obligatorio')) },
                }),
            },
            view: () => <span data-testid="msg">{getC().model.$.propState['name']?.visibleError}</span>,
        }));

        await act(async () => {
            await comp.validate();
        });
        expect(screen.getByTestId('msg')).toHaveTextContent('Required');

        act(() => {
            locale = 'es';
            listeners.forEach((l) => l());
        });
        expect(screen.getByTestId('msg')).toHaveTextContent('Obligatorio');
    });

    it('onSubmit-only validator runs only on validate()', async () => {
        const spy = vi.fn((v: string) => (v ? undefined : { isValid: false, message: 'Required' }));
        const comp = mountComp<NameStruct>(() => ({
            regType: 'SubmitOnlyComp',
            props: { name: prop({ initialValue: 'x', validator: { onSubmit: true, validate: spy } }) },
            view: () => <span />,
        }));

        await act(async () => {
            comp.model.name = '';
            await comp.touch('name');
        });
        expect(spy).not.toHaveBeenCalled();

        let ok = true;
        await act(async () => {
            ok = await comp.validate();
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(ok).toBe(false);
    });

    it('stale async result is dropped', async () => {
        const calls: Array<{ value: string; resolve: (r: ValidationResult | undefined) => void }> = [];
        const comp = mountComp<NameStruct>(() => ({
            regType: 'StaleComp',
            props: {
                name: prop({
                    initialValue: '',
                    validator: {
                        validate: (value: string) =>
                            new Promise<ValidationResult | undefined>((resolve) => {
                                calls.push({ value, resolve });
                            }),
                    },
                }),
            },
            view: () => <span />,
        }));

        await act(async () => {
            comp.model.name = 'a';
            comp.model.name = 'ab';
        });
        await waitFor(() => expect(calls.length).toBe(2));
        await act(async () => {
            calls[1]?.resolve(undefined);
            await Promise.resolve();
            calls[0]?.resolve({ isValid: false, message: 'Too short' });
            await Promise.resolve();
        });
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        expect(comp.model.$.propState['name']?.validation?.isValid).toBe(true);
        expect(comp.model.$.propState['name']?.validating).toBe(false);
    });

    it('throwing validator goes to onCatch without a rejection', async () => {
        const onCatch = vi.fn();
        const comp = mountComp<NameStruct>(() => ({
            regType: 'ThrowComp',
            props: {
                name: prop({
                    initialValue: '',
                    validator: {
                        validate: () => {
                            throw new Error('boom');
                        },
                    },
                }),
            },
            events: { onCatch },
            view: () => <span />,
        }));

        let ok = false;
        await act(async () => {
            ok = await comp.validate('name');
        });
        expect(ok).toBe(true);
        expect(onCatch).toHaveBeenCalledTimes(1);
        expect(comp.model.$.propState['name']?.validating).toBe(false);
    });

    it('undefined result is valid', async () => {
        const comp = mountComp<NameStruct>(() => ({
            regType: 'UndefinedResultComp',
            props: { name: prop({ initialValue: 'x', validator: { validate: () => undefined } }) },
            view: () => <span />,
        }));

        await act(async () => {
            await comp.validate('name');
        });
        expect(comp.model.$.propState['name']?.validation?.isValid).toBe(true);
    });

    it('bindField drives a field child', async () => {
        type FieldStruct = ComponentStruct<TestMsgStruct, {
            props: { value: string; error: boolean; helperText?: string; onBlur?: () => void };
        }>;
        const useField = (params: ComponentParams<FieldStruct>): Component<FieldStruct> => {
            let m: ComponentModel<FieldStruct>;
            const def: ComponentDef<FieldStruct> = {
                regType: 'FieldChild',
                props: { value: '', error: false, helperText: undefined, onBlur: undefined },
                view: () => (
                    <div>
                        <input
                            data-testid="f"
                            value={m.value}
                            onChange={(e) => {
                                m.value = e.target.value;
                            }}
                            onBlur={() => m.onBlur?.()}
                        />
                        <span data-testid="h">{m.helperText}</span>
                        <span data-testid="e">{String(m.error)}</span>
                    </div>
                ),
            };
            const c = useComponent(def, params);
            m = c.model;

            return c;
        };

        type FormStruct = ComponentStruct<TestMsgStruct, {
            props: { name: string };
            children: { field: FieldStruct };
        }>;
        mountComp<FormStruct>((getC) => ({
            regType: 'BindFieldForm',
            props: { name: prop({ initialValue: '', validator: { validate: required() } }) },
            children: { field: useField({ ...bindField(getC, 'name', { hint: () => 'Hint' }) }) },
            view: () => {
                const c = getC();

                return <c.children.Field />;
            },
        }));

        expect(screen.getByTestId('h')).toHaveTextContent('Hint');
        expect(screen.getByTestId('e')).toHaveTextContent('false');

        await act(async () => {
            fireEvent.blur(screen.getByTestId('f'));
        });
        await waitFor(() => expect(screen.getByTestId('h')).toHaveTextContent('Required'));
        expect(screen.getByTestId('e')).toHaveTextContent('true');

        await act(async () => {
            fireEvent.change(screen.getByTestId('f'), { target: { value: 'Ann' } });
        });
        await waitFor(() => expect(screen.getByTestId('h')).toHaveTextContent('Hint'));
        expect(screen.getByTestId('e')).toHaveTextContent('false');
    });
});
