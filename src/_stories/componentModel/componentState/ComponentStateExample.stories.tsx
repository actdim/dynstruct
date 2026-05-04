import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { AppContextProvider, appMsgBus } from '../bootstrap';
import { ComponentStateExample } from './ComponentStateExample';

const meta: Meta<typeof ComponentStateExample> = {
    title: 'dynstruct/Basics',
    component: ComponentStateExample,
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

type Story = StoryObj<typeof ComponentStateExample>;

export const ComponentStateStory: Story = {
    name: 'Component State',
    args: {},
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates <b>component state</b> via the message bus. Clicking{' '}
                <i>Request More</i> sends a typed request through the bus, fetches a batch of texts
                from <b>fakerapi.it</b>, and appends them to the list. A <i>Loading…</i> indicator
                is driven by <code>m.$.pendingRequestCount</code>.
            </p>
            <ComponentStateExample {...args} />
        </div>
    ),
};
