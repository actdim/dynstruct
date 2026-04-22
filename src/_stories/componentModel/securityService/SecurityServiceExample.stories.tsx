import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppContextProvider, appMsgBus } from '../bootstrap';
import { SecurityServiceExample } from './SecurityServiceExample';
import { BaseAppDomainConfig } from '@/appDomain/commonContracts';
import { SecurityDemoServiceProvider } from './SecureApiServiceProvider';
import { SecurityService } from '@/services/react/SecurityService';
import { StorageService } from '@/services/react/StorageService';

const appConfig: BaseAppDomainConfig = {
    id: 'test',
    security: {
        id: 'test',
        // authType: "bearer",
        routes: {
            authSignIn: null,
            authSignOut: null,
            authSignInPage: '/login',
            authSignOutPage: '/logout',
        },
    },
};

appMsgBus.provide({
    channel: 'APP.CONFIG.GET',
    callback: () => {
        return appConfig;
    },
});

appMsgBus.provide({
    channel: 'APP.SECURITY.CONFIG.GET',
    callback: () => {
        return appConfig.security;
    },
});

const meta: Meta<typeof SecurityServiceExample> = {
    title: 'dynstruct/Integration',
    component: SecurityServiceExample,
    decorators: [
        (Story) => (
            <AppContextProvider value={{ msgBus: appMsgBus }}>
                <StorageService storeName={'test'}></StorageService>
                <SecurityService></SecurityService>
                <SecurityDemoServiceProvider></SecurityDemoServiceProvider>
                <Story></Story>
            </AppContextProvider>
        ),
    ],
    loaders: [
        async () => {
            return { foo: 'bar' };
        },
    ],
    args: {},
};

export default meta;

type Story = StoryObj<typeof SecurityServiceExample>;

export const SecurityServiceExampleStory: Story = {
    args: {},
    name: 'Security Service Example',
    render: (args, context) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                Demonstrates <b>security service integration</b> — sign-in/sign-out flow and
                secure API access. Use email <code>admin@mail.com</code> / password{' '}
                <code>admin</code> to authenticate.
            </p>
            <SecurityServiceExample />
        </div>
    ),
};
