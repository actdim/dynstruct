import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ComponentConnectionExample } from './ConnectionExample';
import { AppContextProvider, appMsgBus } from './bootstrap';

const meta: Meta<typeof ComponentConnectionExample> = {
    title: 'dynstruct/Connection',
    component: ComponentConnectionExample,
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

type Story = StoryObj<typeof ComponentConnectionExample>;

export const ConnectionBasicsStory: Story = {
    name: 'Basics',
    args: {},
};
