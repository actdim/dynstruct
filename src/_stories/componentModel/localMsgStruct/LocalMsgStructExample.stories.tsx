import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LocalMsgStructExample } from './LocalMsgStructExample';
import { AppContextProvider, appMsgBus } from '../bootstrap';

const meta: Meta<typeof LocalMsgStructExample> = {
    title: 'dynstruct/Basics',
    component: LocalMsgStructExample,
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

type Story = StoryObj<typeof LocalMsgStructExample>;

export const LocalMsgStructStory: Story = {
    name: 'Local Msg Struct',
    args: {},
};
