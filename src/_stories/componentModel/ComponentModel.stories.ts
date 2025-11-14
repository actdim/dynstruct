import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SimpleComponentFC } from './SimpleComponent';

const meta: Meta<typeof SimpleComponentFC> = {
    title: 'dynstruct/Basics',
    component: SimpleComponentFC,
    args: {

    },
};
export default meta;

type Story = StoryObj<typeof SimpleComponentFC>;

export const SimpleComponent: Story = {
    args: {

    },
};
