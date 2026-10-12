import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { useComponent } from '@/componentModel/react/hooks';
// namespace access is not rewritten by the dynstruct Vite plugin (active in this test config): runtime fallback path
import * as hooks from '@/componentModel/react/hooks';
import type { Component, ComponentDef, ComponentParams, ComponentStruct } from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';

// regType: def.regType > build-time metadata (dynstruct Vite plugin) > DEV stack label > 'component'
// (feat--regtype-vite-plugin).

type TestMsgStruct = BaseAppMsgStruct;
const msgBus = createMsgBus<TestMsgStruct>();
type S = ComponentStruct<TestMsgStruct, { props: { x: string } }>;

const RealError = globalThis.Error;

afterEach(() => {
    globalThis.Error = RealError;
});

function renderWith(useHook: (params: ComponentParams<S>) => Component<S>) {
    let instance: Component<S> | undefined;
    const Host = () => {
        const c = useHook({});
        instance = c;

        return <c.View />;
    };
    render(
        <ComponentContextProvider value={{ msgBus }}>
            <Host />
        </ComponentContextProvider>,
    );

    return instance!;
}

describe('regType resolution', () => {
    it('uses the metadata injected by the plugin', () => {
        const c = renderWith((params) => {
            const def: ComponentDef<S> = { props: { x: '' }, view: () => <span>x</span> };

            return useComponent(def, params, undefined, { regType: 'StorageCard' });
        });
        expect(c.regType).toBe('StorageCard');
        expect(c.id).toMatch(/#\d+$/);
    });

    it('prefers an explicit def.regType over metadata', () => {
        const c = renderWith((params) => {
            const def: ComponentDef<S> = { regType: 'Explicit', props: { x: '' }, view: () => <span>x</span> };

            return useComponent(def, params, undefined, { regType: 'FromPlugin' });
        });
        expect(c.regType).toBe('Explicit');
    });

    it('does not throw when the stack is unavailable or in an unknown format', () => {
        // callable with and without `new`, like the real Error
        function StacklessError(message?: string) {
            const error = new RealError(message);
            Object.defineProperty(error, 'stack', { value: 'no frames here' });

            return error;
        }
        StacklessError.prototype = RealError.prototype;
        globalThis.Error = StacklessError as unknown as ErrorConstructor;
        const c = renderWith((params) => {
            const def: ComponentDef<S> = { props: { x: '' }, view: () => <span>x</span> };

            return hooks.useComponent(def, params);
        });
        globalThis.Error = RealError;
        expect(c.regType).toBe('component');
        expect(c.id).toMatch(/^component#\d+$/);
    });

    it('gets the hook name from the plugin in the real transform pipeline', () => {
        const useStorageCard = (params: ComponentParams<S>) => {
            const def: ComponentDef<S> = { props: { x: '' }, view: () => <span>x</span> };

            return useComponent(def, params);
        };
        const c = renderWith(useStorageCard);
        expect(c.regType).toBe('StorageCard');
    });
});
