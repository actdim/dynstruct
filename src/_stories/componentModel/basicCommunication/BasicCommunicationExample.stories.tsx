import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from '../bootstrap';
import { BasicCommunicationExample } from './BasicCommunicationExample';

const meta: Meta<typeof BasicCommunicationExample> = {
    title: 'dynstruct/Communication',
    component: BasicCommunicationExample,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <Story></Story>
            </AppContextProvider>
        ),
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Demonstrates message-based communication between two components via `msgBus`. ' +
                    'The **Producer** sends a `TEST-EVENT` message; the **Consumer** receives it and updates its value. ' +
                    'The Consumer can suppress incoming messages using the *Ignore messages* flag.',
            },
        },
    },
    args: {},
};

export default meta;

type Story = StoryObj<typeof BasicCommunicationExample>;

export const ConnectionBasicsStory: Story = {
    name: 'Simple',
    args: {},
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Two components communicate via <code>msgBus</code>. The <b>Producer</b> sends a
                message; the <b>Consumer</b> receives and displays it. Use <i>Ignore messages</i> to
                suppress incoming events.
            </p>
            <BasicCommunicationExample {...args} />
        </div>
    ),
};
