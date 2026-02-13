import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SimpleComponent } from './SimpleComponent';
import { AppContextProvider, appMsgBus } from './bootstrap';
import { EffectDemo } from './EffectDemo';

const meta: Meta<typeof EffectDemo> = {
    title: 'dynstruct/Basics',
    component: EffectDemo,
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

export const EffectDemoStory: Story = {
    args: {},
};
