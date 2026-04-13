import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { AppContextProvider, appMsgBus } from '../bootstrap';
import { CustomMsgStructExample } from './CustomMsgStructExample';

const meta: Meta<typeof CustomMsgStructExample> = {
    title: 'dynstruct/Basics',
    component: CustomMsgStructExample,
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

type Story = StoryObj<typeof CustomMsgStructExample>;

export const CustomMsgStructStory: Story = {
    name: 'Custom Msg Struct',
    args: {},
};
