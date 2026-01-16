import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from '../bootstrap';
import { StorageService } from '@/services/react/StorageService';
import { StorageServiceExample } from './StorageServiceExample';

const meta: Meta<typeof StorageServiceExample> = {
    title: 'dynstruct/Basics',
    component: StorageServiceExample,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <StorageService storeName={"test"}>
                    <Story></Story>
                </StorageService>
            </AppContextProvider>
        ),
    ],
    args: {},
};

export default meta;

type Story = StoryObj<typeof StorageServiceExample>;

export const StorageServiceExampleStory: Story = {
    name: 'Storage Service',
    args: {},
};
