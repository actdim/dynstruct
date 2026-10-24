import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { NavLink, handleNavLinkClick } from '@/services/react/NavLink';
import { isAppHref, isPlainLeftClick } from '@/appDomain/navigation';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

// feat--nav-link: route controls are real links; a plain click navigates through the bus, any other click is native.

function setup() {
    const msgBus = createMsgBus<BaseAppMsgStruct>();
    const gotos: unknown[] = [];
    msgBus.on({
        channel: 'APP.NAV.GOTO',
        group: 'in',
        callback: (msg) => {
            gotos.push(msg.payload);
        },
    });
    render(
        <ComponentContextProvider value={{ msgBus }}>
            <NavLink href='/explorer?driveId=d&path=%2F' content='Explorer' />
        </ComponentContextProvider>
    );

    return { msgBus, gotos, link: screen.getByText('Explorer') };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('NavLink', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders an anchor with the route href', () => {
        const { link } = setup();
        expect(link.tagName).toBe('A');
        expect(link.getAttribute('href')).toBe('/explorer?driveId=d&path=%2F');
    });

    it('plain click navigates through APP.NAV.GOTO without a reload', async () => {
        const { link, gotos } = setup();
        const notPrevented = fireEvent.click(link, { button: 0 });
        await flush();
        expect(notPrevented).toBe(false);
        expect(gotos).toEqual([{ url: '/explorer?driveId=d&path=%2F', replace: false, state: undefined }]);
    });

    it('modified and middle clicks are left to the browser', async () => {
        const { link, gotos } = setup();
        expect(fireEvent.click(link, { button: 0, ctrlKey: true })).toBe(true);
        expect(fireEvent.click(link, { button: 0, metaKey: true })).toBe(true);
        expect(fireEvent.click(link, { button: 0, shiftKey: true })).toBe(true);
        expect(fireEvent.click(link, { button: 1 })).toBe(true);
        await flush();
        expect(gotos).toEqual([]);
    });
});

describe('link click helpers', () => {
    const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };

    it('classifies clicks and hrefs', () => {
        expect(isPlainLeftClick(click)).toBe(true);
        expect(isPlainLeftClick(click, '_blank')).toBe(false);
        expect(isPlainLeftClick({ ...click, altKey: true })).toBe(false);
        expect(isAppHref('/library')).toBe(true);
        expect(isAppHref('//evil.example')).toBe(false);
        expect(isAppHref('https://example.com')).toBe(false);
        expect(isAppHref(undefined)).toBe(false);
    });

    it('external hrefs are not intercepted', () => {
        const msgBus = createMsgBus<BaseAppMsgStruct>();
        let prevented = false;
        const handled = handleNavLinkClick({ ...click, preventDefault: () => { prevented = true; } }, msgBus, 'https://example.com');
        expect(handled).toBe(false);
        expect(prevented).toBe(false);
    });

    it('calls onNavigate before an in-place navigation', () => {
        const msgBus = createMsgBus<BaseAppMsgStruct>();
        const calls: string[] = [];
        handleNavLinkClick({ ...click, preventDefault: () => undefined }, msgBus, '/a', {
            onNavigate: () => {
                calls.push('nav');
            },
        });
        expect(calls).toEqual(['nav']);
    });
});
