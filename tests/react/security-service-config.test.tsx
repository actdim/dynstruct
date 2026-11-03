import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { SecurityService, validateSecurityDomainConfig } from '@/services/react/SecurityService';
import { createMsgBus } from '@actdim/msgmesh/core';
import type { BaseAppMsgStruct } from '@/appDomain/appContracts';
import type { BaseSecurityDomainConfig } from '@/appDomain/commonContracts';

describe('SecurityService domain config', () => {
    afterEach(cleanup);

    const routes = { authSignInPage: '/login', authSignOutPage: '/logout' };
    const noEndpoints: BaseSecurityDomainConfig = { id: 'test', routes };
    const withEndpoints: BaseSecurityDomainConfig = {
        id: 'test',
        routes,
        endpoints: { authSignIn: '/auth/sign-in', authSignOut: '/auth/sign-out' },
    };

    function setup(config: BaseSecurityDomainConfig, useConventions: boolean) {
        const msgBus = createMsgBus<BaseAppMsgStruct>();
        msgBus.provide({ channel: 'APP.SECURITY.CONFIG.GET', callback: () => config });
        msgBus.provide({ channel: 'APP.STORE.GET', callback: () => undefined });
        render(
            <ComponentContextProvider value={{ msgBus }}>
                <SecurityService useConventions={useConventions} />
            </ComponentContextProvider>,
        );
        return msgBus;
    }

    it('validateSecurityDomainConfig: conventions mode without authSignIn throws', () => {
        expect(() => validateSecurityDomainConfig(noEndpoints, true)).toThrow(/endpoints\.authSignIn/);
    });

    it('validateSecurityDomainConfig: conventions mode with authSignIn passes', () => {
        expect(() => validateSecurityDomainConfig(withEndpoints, true)).not.toThrow();
    });

    it('validateSecurityDomainConfig: custom mode needs no endpoints', () => {
        expect(() => validateSecurityDomainConfig(noEndpoints, false)).not.toThrow();
        expect(() => validateSecurityDomainConfig(undefined, false)).not.toThrow();
    });

    it('useConventions=false without endpoints answers AUTH.INFO.GET', async () => {
        const msgBus = setup(noEndpoints, false);
        const res = await msgBus.request({ channel: 'APP.SECURITY.AUTH.INFO.GET' });
        expect(res.payload?.scheme).toBe('Bearer');
    });

    it('useConventions=true without endpoints rejects at init', async () => {
        const msgBus = setup(noEndpoints, true);
        await expect(msgBus.request({ channel: 'APP.SECURITY.AUTH.INFO.GET' })).rejects.toThrow(/endpoints\.authSignIn/);
    });

    it('useConventions=true with endpoints answers AUTH.INFO.GET', async () => {
        const msgBus = setup(withEndpoints, true);
        const res = await msgBus.request({ channel: 'APP.SECURITY.AUTH.INFO.GET' });
        expect(res.payload?.scheme).toBe('Bearer');
    });
});
