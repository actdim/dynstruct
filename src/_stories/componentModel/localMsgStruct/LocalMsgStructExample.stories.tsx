import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LocalMsgStructExampleFC } from './LocalMsgStructExample';
import { AppContextProvider, appMsgBus } from '../bootstrap';

const meta: Meta<typeof LocalMsgStructExampleFC> = {
    title: 'dynstruct/Basics',
    component: LocalMsgStructExampleFC,
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

type Story = StoryObj<typeof LocalMsgStructExampleFC>;

export const LocalMsgStruct: Story = {
    name: 'Local Msg Struct',
    args: {},
};
