import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from '../bootstrap';
import { ServiceCallExample, ApiServiceProvider } from './ServiceCallExample';

const meta: Meta<typeof ServiceCallExample> = {
    title: 'dynstruct/Basics',
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
    render: (args, context) => {
        // console.log('loaded:', context.loaded);
        return <ServiceCallExample />;
    },
};
