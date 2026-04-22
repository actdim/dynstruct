import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from './bootstrap';
import { ParentChildConnectionExample } from './ParentChildConnectionExample';

const meta: Meta<typeof ParentChildConnectionExample> = {
    title: 'dynstruct/Communication',
    component: ParentChildConnectionExample,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <Story></Story>
            </AppContextProvider>
        ),
    ],
    args: {},
};

export default meta;

type Story = StoryObj<typeof ParentChildConnectionExample>;

export const ConnectionParentChildStory: Story = {
    name: 'Parent/Child',
    args: {},
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates <b>parent/child communication</b>. Each child can send events that the
                parent intercepts. The parent also provides a local service children can request —
                try <i>Send</i> and <i>Request</i> in both containers.
            </p>
            <ParentChildConnectionExample />
        </div>
    ),
};
