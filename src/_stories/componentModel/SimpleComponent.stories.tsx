import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SimpleComponent } from './SimpleComponent';
import { AppContextProvider, appMsgBus } from './bootstrap';

const meta: Meta<typeof SimpleComponent> = {
    title: 'dynstruct/Basics',
    component: SimpleComponent,
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

type Story = StoryObj<typeof SimpleComponent>;

export const SimpleComponentStory: Story = {
    args: {},
};
