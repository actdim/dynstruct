import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from '../bootstrap';
import { ServiceCallExample } from './ServiceCallExample';
import { ApiServiceProvider } from './ApiServiceProvider';

const meta: Meta<typeof ServiceCallExample> = {
    title: 'dynstruct/Integration',
    component: ServiceCallExample,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <ApiServiceProvider></ApiServiceProvider>
                <Story></Story>
            </AppContextProvider>
        ),
    ],
    loaders: [
        async () => {
            return { foo: 'bar' };
        },
    ],
    args: {},
};

export default meta;

type Story = StoryObj<typeof ServiceCallExample>;

export const ServiceCallExampleStory: Story = {
    args: {},
    name: 'Service (Api) Call Example',
    render: (args, context) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates <b>API service calls</b> via the message bus. Clicking{' '}
                <i>Load data</i> sends a typed request through the bus and renders the response
                list below.
            </p>
            <ServiceCallExample />
        </div>
    ),
};
