import { MaybePromise } from '@actdim/utico/typeCore';
import React, { PropsWithChildren } from 'react';

export type ErrorBoundaryProps = {
    fallback?: (error: unknown) => React.ReactNode;
    onCatch?: (error: unknown, info?: unknown) => MaybePromise<void>;
} & PropsWithChildren;
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    { hasError: boolean; error: unknown }
> {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true, error };
    }

    componentDidCatch(error: unknown, info: any) {
        if (this.props.onCatch) {
            this.props.onCatch(error, info);
        } else {
            // info has componentStack
            console.error('ErrorBoundary caught:', { error, info });
        }
    }

    render() {
        let content: React.ReactNode;
        if (this.state.hasError) {
            const error = this.state.error;
            if (this.props.fallback) {
                content = this.props.fallback(error);
            }
            if (content == undefined) {
                content = (
                    <div
                        style={{
                            border: '1px solid red',
                            padding: 16,
                            borderRadius: 4,
                            background: '#ffeeee',
                            fontFamily: 'sans-serif',
                        }}
                    >
                        <strong>Something went wrong 😢</strong>
                        <div>{error.message || String(error)}</div>

                        {error instanceof Error && error.stack && (
                            <details style={{ marginTop: 8 }}>
                                <summary style={{ cursor: 'pointer' }}>
                                    Show details (stack trace)
                                </summary>
                                <pre
                                    style={{
                                        marginTop: 4,
                                        // background: '#fff5f5',
                                        background: '#dddddd',
                                        padding: 8,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        overflow: 'auto',
                                        maxHeight: 200,
                                    }}
                                >
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                );
            }
        } else {
            content = this.props.children;
        }
        return content;
    }
}
