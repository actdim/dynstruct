import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from './bootstrap';
import { ApiCallExampleFC, msgProviderAdapters } from './ApiCallExample';
import { ServiceProvider } from '@/services/ServiceProvider';

const meta: Meta<typeof ApiCallExampleFC> = {
    title: 'dynstruct/Basics',
    component: ApiCallExampleFC,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <ServiceProvider adapters={msgProviderAdapters}></ServiceProvider>
                <Story></Story>
            </AppContextProvider>
        ),
    ],
    args: {},
};

export default meta;

type Story = StoryObj<typeof ApiCallExampleFC>;

export const ApiCallExample: Story = {
    args: {},
};
