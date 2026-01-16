import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from './bootstrap';
import { ParentChildConnectionExample } from './ParentChildConnectionExample';

const meta: Meta<typeof ParentChildConnectionExample> = {
    title: 'dynstruct/Connection',
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
};
