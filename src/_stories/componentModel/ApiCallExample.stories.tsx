import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from './bootstrap';
import { ApiCallExample, ApiServiceProvider } from './ApiCallExample';

const meta: Meta<typeof ApiCallExample> = {
    title: 'dynstruct/Basics',
    component: ApiCallExample,
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

type Story = StoryObj<typeof ApiCallExample>;

export const ApiCallExampleStory: Story = {
    args: {},
    render: (args, context) => {
        // console.log('loaded:', context.loaded);
        return <ApiCallExample />;
    },
};
