import React, { PropsWithChildren } from 'react';

export class ErrorBoundary extends React.Component<
    { onError?: (error: unknown, info?: unknown) => React.ReactNode } & PropsWithChildren,
    { hasError: boolean; error: unknown }
> {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true, error };
    }

    componentDidCatch(error: unknown, info: any) {
        // console.error('ErrorBoundary caught:', error);
        // console.error(info.componentStack);
        this.props.onError?.(error, info);
    }

    render() {
        let content: React.ReactNode;
        if (this.state.hasError) {
            const error = this.state.error;
            if (this.props.onError) {
                content = this.props.onError?.(error);
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
