import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { AppMsgStruct } from './bootstrap';
import { detailsStyle, labelStyle, row } from './styles';
import { BaseAppMsgChannels } from '@/appDomain/appContracts';

type ErrorDemoStruct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            triggered: boolean;
        };
    }
>;

const useStandardFallbackDemo = (params: ComponentParams<ErrorDemoStruct>) => {
    let c: Component<ErrorDemoStruct>;
    let m: ComponentModel<ErrorDemoStruct>;

    const def: ComponentDef<ErrorDemoStruct> = {
        props: { triggered: false },
        // useErrorBoundary defaults to true — standard fallback is used automatically
        view: () => {
            if (m.triggered) throw new Error('Simulated render error in component');
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                        Standard Fallback
                    </summary>
                    <div style={{ ...row, marginTop: 4 }}>
                        <button onClick={() => (m.triggered = true)}>Trigger error</button>
                    </div>
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

const useCustomFallbackDemo = (params: ComponentParams<ErrorDemoStruct>) => {
    let c: Component<ErrorDemoStruct>;
    let m: ComponentModel<ErrorDemoStruct>;

    const def: ComponentDef<ErrorDemoStruct> = {
        props: { triggered: false },
        fallbackView: () => (
            <div
                style={{
                    padding: '10px 14px',
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: 6,
                }}
            >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Handled gracefully</div>
                <div style={{ fontSize: 12, color: '#856404' }}>
                    A custom <code>fallbackView</code> replaced the broken component.
                </div>
            </div>
        ),
        view: () => {
            if (m.triggered) throw new Error('Simulated render error in component');
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                        Custom Fallback
                    </summary>
                    <div style={{ ...row, marginTop: 4 }}>
                        <button onClick={() => (m.triggered = true)}>Trigger error</button>
                    </div>
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

type AsyncErrorDemoStruct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            status: 'idle' | 'loading' | 'error';
            errorMessage: string;
        };
        msgScope: {
            subscribe: BaseAppMsgChannels<'APP.ERROR'>;
        };
    }
>;

const useAsyncErrorDemo = (params: ComponentParams<AsyncErrorDemoStruct>) => {
    let c: Component<AsyncErrorDemoStruct>;
    let m: ComponentModel<AsyncErrorDemoStruct>;

    async function simulateRequest() {
        await new Promise<void>((r) => setTimeout(r, 600));
        throw new Error('Network request failed: connection timeout');
    }

    async function load() {
        m.status = 'loading';
        m.errorMessage = '';
        await simulateRequest();
        m.status = 'idle';
    }

    function handleError(err: unknown) {
        m.status = 'error';
        m.errorMessage = err instanceof Error ? err.message : String(err);
    }

    const def: ComponentDef<AsyncErrorDemoStruct> = {
        props: { status: 'idle', errorMessage: '' },
        useErrorBoundary: false,
        msgBroker: {
            subscribe: {
                'APP.ERROR': {
                    in: {
                        callback: (msg) => {
                            console.warn(msg);
                        },
                        topic: '/.*/',
                    },
                },
            },
        },
        events: {
            // Framework wraps onReady in runSafe — async errors propagate to onCatch
            onReady: async () => {
                await load();
            },
            onCatch: (_, err) => {
                handleError(err);
            },
        },
        view: () => (
            <details open style={detailsStyle}>
                <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                    Async Error / onCatch
                </summary>
                <div style={row}>
                    <span style={labelStyle}>Status</span>
                    <span style={{ fontSize: 13 }}>
                        {m.status === 'loading' ? (
                            <i style={{ color: '#888' }}>loading…</i>
                        ) : m.status === 'error' ? (
                            <span style={{ color: '#dc3545' }}>error</span>
                        ) : (
                            'idle'
                        )}
                    </span>
                </div>
                {m.errorMessage && (
                    <div style={{ ...row, color: '#dc3545', fontSize: 12, fontStyle: 'italic' }}>
                        {m.errorMessage}
                    </div>
                )}
                <div style={{ ...row, marginTop: 10 }}>
                    {/* Button calls load() directly — framework doesn't wrap clicks,
                        so we catch manually with the same handler */}
                    <button
                        disabled={m.status === 'loading'}
                        onClick={async () => {
                            try {
                                await load();
                            } catch (err) {
                                handleError(err);
                            }
                        }}
                    >
                        Retry
                    </button>
                </div>
            </details>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

type DemoStruct = ComponentStruct<
    AppMsgStruct,
    {
        children: {
            standard: ErrorDemoStruct;
            custom: ErrorDemoStruct;
            asyncError: AsyncErrorDemoStruct;
        };
    }
>;

export const useErrorBoundaryDemo = (params: ComponentParams<DemoStruct>) => {
    let c: Component<DemoStruct>;

    const def: ComponentDef<DemoStruct> = {
        children: {
            standard: useStandardFallbackDemo({}),
            custom: useCustomFallbackDemo({}),
            asyncError: useAsyncErrorDemo({}),
        },
        view: () => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <c.children.standard.View />
                <c.children.custom.View />
                <c.children.asyncError.View />
            </div>
        ),
    };

    c = useComponent(def, params);
    return c;
};

export type ErrorBoundaryDemoStruct = DemoStruct;
export const ErrorBoundaryDemo = toReact(useErrorBoundaryDemo);
