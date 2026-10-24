import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { NavService } from '@/services/react/NavService';
import { createNavigationRoute, getUrlBuilder, toRouteHref } from '@/appDomain/navigation';
import { type NavContext } from '@/appDomain/commonContracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

// bug--nav-service-location-sync: NavService publishes APP.NAV.CONTEXT.CHANGED on every location change
// (push, replace, pop) with the live location, not only once on mount.

const routes = {
    a: createNavigationRoute({ pattern: 'a', element: null }),
    b: createNavigationRoute<{ x?: string }>({ pattern: 'b', element: null }),
    c: createNavigationRoute({ pattern: 'c', element: null }),
};

function setup(strict = false) {
    const msgBus = createMsgBus<BaseAppMsgStruct>();
    const published: NavContext[] = [];
    msgBus.on({
        channel: 'APP.NAV.CONTEXT.CHANGED',
        group: 'in',
        callback: (msg) => {
            published.push(msg.payload);
        },
    });
    const Layout = () => {
        return (
            <>
                <NavService routes={routes} />
                <Outlet />
            </>
        );
    };
    const router = createMemoryRouter(
        [
            {
                element: <Layout />,
                children: [
                    { path: '/a', element: <div>A</div> },
                    { path: '/b', element: <div>B</div> },
                    { path: '/c', element: <div>C</div> },
                ],
            },
        ],
        { initialEntries: ['/a'] }
    );
    const tree = (
        <ComponentContextProvider value={{ msgBus }}>
            <RouterProvider router={router} />
        </ComponentContextProvider>
    );
    render(strict ? <React.StrictMode>{tree}</React.StrictMode> : tree);
    const last = () => published[published.length - 1];
    const goto = async (payload: Record<string, unknown>) => {
        await act(async () => {
            await msgBus.request({ channel: 'APP.NAV.GOTO', group: 'in', payload: payload as never });
        });
    };

    return { msgBus, router, published, last, goto };
}

describe('NavService location sync', () => {
    afterEach(() => {
        cleanup();
    });

    it('publishes the initial location exactly once, also under StrictMode', async () => {
        const { published } = setup(true);
        await waitFor(() => {
            expect(published.length).toBe(1);
        });
        expect(published[0].location?.pathname).toBe('/a');
    });

    it('publishes push, replace and history back with the live location', async () => {
        const { published, last, goto, msgBus } = setup();
        await waitFor(() => {
            expect(published.length).toBe(1);
        });

        await goto({ url: '/b' });
        await waitFor(() => {
            expect(last().location?.pathname).toBe('/b');
        });
        expect(last().navType).toBe('PUSH');

        await goto({ url: '/c', replace: true });
        await waitFor(() => {
            expect(last().location?.pathname).toBe('/c');
        });
        expect(last().navType).toBe('REPLACE');

        // /b was replaced by /c, so going back lands on /a
        await goto({ path: -1 });
        await waitFor(() => {
            expect(last().location?.pathname).toBe('/a');
        });
        expect(last().navType).toBe('POP');
        expect(published.length).toBe(4);

        const ctx = await msgBus.request({ channel: 'APP.NAV.CONTEXT.GET', group: 'in' });
        expect(ctx.payload.location?.pathname).toBe('/a');
    });

    it('publishes navigations made outside the bus (browser back/forward)', async () => {
        const { published, last, router } = setup();
        await act(async () => {
            await router.navigate('/b?q=1');
        });
        await waitFor(() => {
            expect(last().location?.pathname).toBe('/b');
        });
        expect(last().searchParams?.get('q')).toBe('1');

        await act(async () => {
            await router.navigate(-1);
        });
        await waitFor(() => {
            expect(last().location?.pathname).toBe('/a');
        });
        expect(published.length).toBe(3);
    });

    it('passes GOTO state to the new history entry and builds route urls without nullish params', async () => {
        const { last, goto } = setup();
        await goto({ url: '/b', state: { returnTo: '/a' } });
        await waitFor(() => {
            expect(last().location?.pathname).toBe('/b');
        });
        expect(last().location?.state).toEqual({ returnTo: '/a' });

        await goto({ path: 'c', params: { y: undefined } });
        await waitFor(() => {
            expect(last().location?.pathname).toBe('/c');
        });
        expect(last().location?.search).toBe('');
    });
});

describe('route url helpers', () => {
    it('omits nullish params', () => {
        expect(getUrlBuilder('explorer')({ driveId: 'd', path: undefined, file: null })).toBe('explorer?driveId=d');
    });

    it('builds absolute hrefs', () => {
        expect(toRouteHref(routes.b, { x: '1' })).toBe('/b?x=1');
        expect(toRouteHref(routes.a)).toBe('/a');
        expect(toRouteHref(createNavigationRoute({ pattern: '', element: null }))).toBe('/');
    });
});
