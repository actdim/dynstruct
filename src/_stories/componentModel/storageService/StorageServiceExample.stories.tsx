import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from '../bootstrap';
import { StorageServiceFC } from '@/services/StorageService';
import { StorageServiceExampleFC } from './StorageServiceExample';

const meta: Meta<typeof StorageServiceExampleFC> = {
    title: 'dynstruct/Basics',
    component: StorageServiceExampleFC,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <StorageServiceFC storeName={"test"}>
                    <Story></Story>
                </StorageServiceFC>
            </AppContextProvider>
        ),
    ],
    args: {},
};

export default meta;

type Story = StoryObj<typeof StorageServiceExampleFC>;

export const StorageServiceExample: Story = {
    name: 'Storage Service',
    args: {},
};
