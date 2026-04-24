import React from 'react';

import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import { AppMsgStruct } from '../bootstrap';

// import './simpleButton.css';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            email: string;
            password: string;
            error: string;
            onSubmit: ({ email, password }) => void;
            onCancel: () => void;
        };
    }
>;

export const useLoginDialog = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;
    // 'Please fill in all fields'
    const def: ComponentDef<Struct> = {
        props: {
            email: undefined,
            password: undefined,
            error: undefined,
            onSubmit: undefined,
            onCancel: undefined,
        },

        view: () => {
            return (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 12,
                            padding: 32,
                            width: '100%',
                            maxWidth: 360,
                            boxSizing: 'border-box',
                            border: '0.5px solid rgba(0,0,0,0.12)',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: 18,
                                fontWeight: 500,
                                margin: '0 0 4px',
                                color: '#111',
                            }}
                        >
                            Sign in
                        </h2>
                        <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>
                            Enter your credentials to continue
                        </p>

                        <label
                            style={{
                                fontSize: 13,
                                color: '#888',
                                display: 'block',
                                marginBottom: 6,
                            }}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            value={m.email}
                            onChange={(e) => {
                                m.email = e.target.value;
                            }}
                            placeholder="you@example.com"
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '8px 12px',
                                border: '0.5px solid #ccc',
                                borderRadius: 8,
                                fontSize: 14,
                                marginBottom: 16,
                                outline: 'none',
                            }}
                        />

                        <label
                            style={{
                                fontSize: 13,
                                color: '#888',
                                display: 'block',
                                marginBottom: 6,
                            }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            value={m.password}
                            onChange={(e) => {
                                m.password = e.target.value;
                            }}
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '8px 12px',
                                border: '0.5px solid #ccc',
                                borderRadius: 8,
                                fontSize: 14,
                                marginBottom: m.error ? 8 : 24,
                                outline: 'none',
                            }}
                        />

                        {m.error && (
                            <p style={{ fontSize: 13, color: '#e24b4a', margin: '0 0 16px' }}>
                                {m.error}
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                onClick={m.onCancel}
                                style={{
                                    padding: '8px 16px',
                                    border: '0.5px solid #ccc',
                                    borderRadius: 8,
                                    background: 'transparent',
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => m.onSubmit({ email: m.email, password: m.password })}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: 8,
                                    background: '#111',
                                    color: '#fff',
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type LoginDialogStruct = Struct;
export const LoginDialog = toReact(useLoginDialog);
