import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SimpleComponentFC } from './SimpleComponent';
import { AppContextProvider, appMsgBus } from './bootstrap';

const meta: Meta<typeof SimpleComponentFC> = {
    title: 'dynstruct/Basics',
    component: SimpleComponentFC,
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

type Story = StoryObj<typeof SimpleComponentFC>;

export const SimpleComponent: Story = {
    args: {},
};
