import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from './bootstrap';
import { ErrorBoundaryDemo } from './ErrorBoundaryDemo';

const meta: Meta<typeof ErrorBoundaryDemo> = {
    title: 'dynstruct/Basics',
    component: ErrorBoundaryDemo,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <Story />
            </AppContextProvider>
        ),
    ],
    args: {},
};

export default meta;

type Story = StoryObj<typeof ErrorBoundaryDemo>;

export const ErrorBoundaryDemoStory: Story = {
    name: 'Error Boundary',
    args: {},
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates three error-handling patterns. <b>Standard Fallback</b> and{' '}
                <b>Custom Fallback</b> use React error boundaries — a render-time throw is caught
                and replaced by built-in or custom UI (<code>fallbackView</code>). Click{' '}
                <i>Trigger error</i> to see each; reload the story to reset. <b>Async Error</b>{' '}
                shows a different pattern: an async call fails in <code>onReady</code>, the
                framework routes it to <code>onCatch</code>, which updates component state — no
                boundary involved, the view keeps rendering normally. The{' '}
                <i>Retry</i> button repeats the same call with the same handler.
            </p>
            <ErrorBoundaryDemo />
        </div>
    ),
};
