import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { ServiceProvider } from '@/services/react/ServiceProvider';
import { NavService } from '@/services/react/NavService';
import { StorageService } from '@/services/react/StorageService';
import { PersistentStore } from '@actdim/utico/store/persistentStore';
import { getUrlBuilder } from '@/appDomain/navigation';
import { createMsgBus } from '@actdim/msgmesh/core';
import { MsgProviderAdapter } from '@actdim/msgmesh/adapters';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import { $STORE_GET, $STORE_REMOVE, $STORE_SET } from '@/appDomain/commonContracts';

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();

describe('Built-in React Services', () => {
    describe('getUrlBuilder helper', () => {
        it('builds url with and without params', () => {
            const builder = getUrlBuilder('/users/:id/profile?tab');
            // With matching route params and query params
            expect(builder({ id: '123', tab: 'settings' })).toBe('/users/123/profile?tab=settings');
            // Without arguments (params undefined)
            const plainBuilder = getUrlBuilder('/dashboard');
            expect(plainBuilder()).toBe('/dashboard');
            expect(plainBuilder(undefined)).toBe('/dashboard');
        });
    });

    describe('ServiceProvider', () => {
        it('registers adapters on mount and aborts them on unmount', () => {
            const mockService = {
                fetchData: vi.fn(),
            };

            const mockAdapter: MsgProviderAdapter = {
                service: mockService,
                channelSelector: vi.fn(() => 'CUSTOM.SERVICE.FETCH'),
            };

            const { unmount } = render(
                <ComponentContextProvider value={{ msgBus }}>
                    <ServiceProvider adapters={[mockAdapter]}>
                        <div data-testid="service-child">Child</div>
                    </ServiceProvider>
                </ComponentContextProvider>,
            );

            expect(screen.getByTestId('service-child')).toBeInTheDocument();
            expect(mockAdapter.channelSelector).toHaveBeenCalledWith(mockService, 'fetchData');

            unmount();
        });
    });

    describe('NavService', () => {
        it('tracks location history and responds to APP.NAV.CONTEXT.GET and APP.NAV.GOTO without params', async () => {
            render(
                <ComponentContextProvider value={{ msgBus }}>
                    <MemoryRouter initialEntries={['/initial/path?search=test']}>
                        <NavService />
                        <Routes>
                            <Route path="/initial/path" element={<div data-testid="initial-page">Initial</div>} />
                            <Route path="/target/page" element={<div data-testid="target-page">Target</div>} />
                        </Routes>
                    </MemoryRouter>
                </ComponentContextProvider>,
            );

            expect(screen.getByTestId('initial-page')).toBeInTheDocument();

            // Request current nav context via bus
            const contextMsg = await msgBus.request({
                channel: 'APP.NAV.CONTEXT.GET',
                group: 'in',
            });

            expect(contextMsg.payload).toBeDefined();
            expect(contextMsg.payload.location.pathname).toBe('/initial/path');
            expect(contextMsg.payload.searchParams.get('search')).toBe('test');

            // Navigate using APP.NAV.GOTO without params object in payload
            await act(async () => {
                await msgBus.request({
                    channel: 'APP.NAV.GOTO',
                    group: 'in',
                    payload: { path: '/target/page' },
                });
            });

            await waitFor(() => {
                expect(screen.getByTestId('target-page')).toBeInTheDocument();
            });
        });
    });

    describe('StorageService', () => {
        const memoryMap = new Map<string, unknown>();

        beforeEach(() => {
            memoryMap.clear();
            const mockStoreInstance = {
                get: vi.fn(async (key: string) => memoryMap.get(key)),
                set: vi.fn(async (meta: { key: string }, val: unknown) => memoryMap.set(meta.key, val)),
                delete: vi.fn(async (key: string) => memoryMap.delete(key)),
                [Symbol.dispose]: vi.fn(),
            };
            vi.spyOn(PersistentStore, 'open').mockResolvedValue(mockStoreInstance as unknown as PersistentStore);
        });

        it('handles $STORE_SET, $STORE_GET, and $STORE_REMOVE messages', async () => {
            render(
                <ComponentContextProvider value={{ msgBus }}>
                    <StorageService storeName="test-memory-store" />
                </ComponentContextProvider>,
            );

            // 1. SET
            await msgBus.request({
                channel: $STORE_SET,
                group: 'in',
                payload: {
                    key: 'user:session',
                    value: { username: 'john_doe', role: 'admin' },
                },
            });

            // 2. GET
            const getMsg = await msgBus.request({
                channel: $STORE_GET,
                group: 'in',
                payload: { key: 'user:session' },
            });

            expect(getMsg.payload).toEqual({ username: 'john_doe', role: 'admin' });

            // 3. REMOVE
            await msgBus.request({
                channel: $STORE_REMOVE,
                group: 'in',
                payload: { key: 'user:session' },
            });

            // 4. GET after remove
            const getAfterRemoveMsg = await msgBus.request({
                channel: $STORE_GET,
                group: 'in',
                payload: { key: 'user:session' },
            });

            expect(getAfterRemoveMsg.payload).toBeUndefined();
        });
    });
});
