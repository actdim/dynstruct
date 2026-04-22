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
    name: 'Simple Component',
    args: {},
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates <b>basic component features</b> — reactive props, child components, and
                dynamic content. The <i>Add input</i> button increments the counter and adds a new
                dynamic edit field below.
            </p>
            <SimpleComponent {...args} />
        </div>
    ),
};
