import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

describe('Validation and Form Mapping (prop validator, mapToEdit)', () => {
    type FormStruct = ComponentStruct<TestMsgStruct, {
        props: {
            email: string;
            age: number;
        };
        actions: {
            setEmail: (email: string) => void;
        };
    }>;

    const useFormComp = (params?: ComponentParams<FormStruct>) => {
        let c: Component<FormStruct>;
        let m: ComponentModel<FormStruct>;
        const def: ComponentDef<FormStruct> = {
            regType: 'FormComp',
            props: {
                email: prop({
                    initialValue: '',
                    validator: {
                        onBlur: true,
                        validate: (val: string) => {
                            if (!val || !val.includes('@')) {
                                return { isValid: false, message: 'Invalid email address' };
                            }
                            return { isValid: true };
                        },
                    },
                }),
                age: prop({
                    initialValue: 18,
                    validator: {
                        onBlur: true,
                        validate: async (val: number) => {
                            await new Promise((res) => setTimeout(res, 10));
                            if (val < 18) {
                                return { isValid: false, message: 'Must be at least 18' };
                            }
                            return { isValid: true };
                        },
                    },
                }),
            },
            actions: {
                setEmail: (val) => { m.email = val; },
            },
            view: () => {
                const emailInputProps = c.mapToEdit('email');
                const ageInputProps = c.mapToEdit('age');
                const emailError = m.$.propState['email']?.error;
                const ageError = m.$.propState['age']?.error;

                return (
                    <div>
                        <input data-testid="email-input" {...emailInputProps} />
                        {emailError && <span data-testid="email-error">{emailError}</span>}

                        <input data-testid="age-input" {...ageInputProps} />
                        {ageError && <span data-testid="age-error">{ageError}</span>}
                    </div>
                );
            },
        };
        c = useComponent(def, params);
        m = c.model;
        return c;
    };

    it('validates property via component.validate(path) and updates propState', async () => {
        let comp: Component<FormStruct>;
        const FormView = toReact<FormStruct>((p) => {
            comp = useFormComp(p);
            return comp;
        });

        wrap(<FormView />);

        await act(async () => {
            await comp.validate('email');
        });

        expect(comp.model.$.propState['email']?.validation?.isValid).toBe(false);
        expect(comp.model.$.propState['email']?.error).toBe('Invalid email address');
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address');

        await act(async () => {
            comp.model.email = 'valid@domain.com';
            await comp.validate('email');
        });

        expect(comp.model.$.propState['email']?.validation?.isValid).toBe(true);
        expect(comp.model.$.propState['email']?.error).toBeUndefined();
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    it('integrates with input controls via mapToEdit and validates on blur', async () => {
        const FormView = toReact(useFormComp);
        wrap(<FormView />);

        const ageInput = screen.getByTestId('age-input');

        await act(async () => {
            fireEvent.change(ageInput, { target: { value: '15' } });
        });
        expect(screen.queryByTestId('age-error')).not.toBeInTheDocument();

        await act(async () => {
            fireEvent.blur(ageInput);
        });

        await waitFor(() => {
            expect(screen.getByTestId('age-error')).toHaveTextContent('Must be at least 18');
        });
    });

    it('executes component-level validate() without crashing when onValidate is undefined', async () => {
        let comp: Component<FormStruct>;
        const FormView = toReact<FormStruct>((p) => {
            comp = useFormComp(p);
            return comp;
        });

        // Render without any $events.onValidate or def.events.onValidate
        wrap(<FormView />);

        await act(async () => {
            await comp.validate();
        });

        expect(comp.model.$.propState['email']?.validation?.isValid).toBe(false);
        expect(comp.model.$.propState['email']?.error).toBe('Invalid email address');
    });

    it('executes custom onValidate handlers from def.events and params.$events', async () => {
        let comp: Component<FormStruct>;
        const customDefEvents = {
            onValidate: async () => ({
                email: { isValid: false, message: 'Custom Def Error' },
            }),
        };

        const useFormWithDefEvents = (params?: ComponentParams<FormStruct>) => {
            const def: ComponentDef<FormStruct> = {
                regType: 'FormWithDefEvents',
                props: { email: '', age: 20 },
                events: customDefEvents,
                view: () => <div>View</div>,
            };
            const c = useComponent(def, params);
            comp = c;
            return c;
        };

        const FormView = toReact(useFormWithDefEvents);

        wrap(
            <FormView
                $events={{
                    onValidate: () => ({
                        age: { isValid: false, message: 'Custom Param Error' },
                    }),
                }}
            />,
        );

        await act(async () => {
            await comp.validate();
        });

        expect(comp.model.$.propState['email']?.error).toBe('Custom Def Error');
        expect(comp.model.$.propState['age']?.error).toBe('Custom Param Error');
    });

    it('automatically runs validator on root property change when validator.onChange is true', async () => {
        type AutoValidateStruct = ComponentStruct<TestMsgStruct, {
            props: {
                username: string;
            };
        }>;

        let comp: Component<AutoValidateStruct>;

        const useAutoValidateComp = (params?: ComponentParams<AutoValidateStruct>) => {
            const def: ComponentDef<AutoValidateStruct> = {
                regType: 'AutoValidateComp',
                props: {
                    username: prop({
                        initialValue: 'initial',
                        validator: {
                            onChange: true,
                            validate: (val: string) => {
                                if (val.length < 3) {
                                    return { isValid: false, message: 'Too short' };
                                }
                                return { isValid: true };
                            },
                        },
                    }),
                },
                view: () => <span data-testid="auto-user">{comp?.model.username}</span>,
            };
            const c = useComponent(def, params);
            comp = c;
            return c;
        };

        const AutoValidateView = toReact(useAutoValidateComp);
        wrap(<AutoValidateView />);

        expect(comp.model.$.propState['username']).toBeUndefined();

        // Direct property mutation should trigger validator.onChange
        await act(async () => {
            comp.model.username = 'ab';
        });

        expect(comp.model.$.propState['username']?.validation?.isValid).toBe(false);
        expect(comp.model.$.propState['username']?.error).toBe('Too short');

        await act(async () => {
            comp.model.username = 'valid_username';
        });

        expect(comp.model.$.propState['username']?.validation?.isValid).toBe(true);
        expect(comp.model.$.propState['username']?.error).toBeUndefined();
    });
});
