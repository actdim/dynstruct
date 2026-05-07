import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from './bootstrap';
import { ConverterDemo } from './ConverterDemo';

const meta: Meta<typeof ConverterDemo> = {
    title: 'dynstruct/Basics',
    component: ConverterDemo,
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

type Story = StoryObj<typeof ConverterDemo>;

export const ConverterDemoStory: Story = {
    name: 'Binding Converter',
    args: {},
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}></p>
            <ConverterDemo {...args} />
        </div>
    ),
};
