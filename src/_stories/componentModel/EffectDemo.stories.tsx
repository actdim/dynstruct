import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
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

type Story = StoryObj<typeof EffectDemo>;

export const EffectDemoStory: Story = {
    name: 'Effects',
    args: {},
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates <b>reactive effects</b> — side-effects that automatically re-run when
                observed model properties change. The <i>trackNameChanges</i> effect keeps{' '}
                <code>fullName</code> in sync with <code>firstName</code> and{' '}
                <code>lastName</code>. Use <b>Pause / Resume</b> to control the effect lifecycle.
            </p>
            <EffectDemo {...args} />
        </div>
    ),
};
