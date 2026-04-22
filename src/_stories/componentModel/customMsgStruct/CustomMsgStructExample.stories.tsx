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
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates <b>custom message structures</b> with typed headers. The todo editor
                sends items with a priority header; items with priority &gt; 0 are inserted at the
                top of the list.
            </p>
            <CustomMsgStructExample {...args} />
        </div>
    ),
};
