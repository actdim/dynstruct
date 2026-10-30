/**
 * @vitest-environment node
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { isUsingStaticRendering } from 'mobx-react-lite';
import { ComponentContextProvider } from '@/componentModel/react/componentContext';
import { toReact, useComponent, useIsomorphicLayoutEffect } from '@/componentModel/react/hooks';
import type {
    Component,
    ComponentDef,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { type BaseAppMsgStruct } from '@/appDomain/appContracts';
import { HttpClient } from '@/net/httpClient';

type TestMsgStruct = BaseAppMsgStruct;

describe('SSR and Isomorphic Runtime Support', () => {
    it('executes in Node.js environment where window is undefined', () => {
        expect(typeof window).toBe('undefined');
    });

    it('automatically enables MobX static rendering in Node.js', () => {
        expect(isUsingStaticRendering()).toBe(true);
    });

    it('exports useIsomorphicLayoutEffect matching useEffect on the server', () => {
        expect(typeof useIsomorphicLayoutEffect).toBe('function');
        expect(useIsomorphicLayoutEffect).toBe(React.useEffect);
    });

    it('renders component to HTML without throwing and without useLayoutEffect warnings', () => {
        const warnSpy = vi.spyOn(console, 'warn');
        const errorSpy = vi.spyOn(console, 'error');

        const msgBus = createMsgBus<TestMsgStruct>();

        type CardStruct = ComponentStruct<TestMsgStruct, {
            props: {
                title: string;
                count: number;
            };
        }>;

        const useCard = (params: ComponentParams<CardStruct>): Component<CardStruct> => {
            const def: ComponentDef<CardStruct> = {
                regType: 'ServerCard',
                props: {
                    title: 'Default Title',
                    count: 0,
                },
                view: (_, c) => (
                    <div id={c.id} className="server-card">
                        <h1>{c.model.title}</h1>
                        <span>Count: {c.model.count}</span>
                    </div>
                ),
            };
            return useComponent(def, params);
        };

        const ServerCard = toReact(useCard);

        const html = renderToString(
            <ComponentContextProvider value={{ msgBus }}>
                <ServerCard title="SSR Header" count={42} $key="test-card" />
            </ComponentContextProvider>,
        );

        expect(html).toContain('id="ServerCard#test-card"');
        expect(html).toContain('SSR Header');
        expect(html).toContain('42');

        const layoutEffectWarnings = warnSpy.mock.calls.filter((args) =>
            args.some((arg) => typeof arg === 'string' && arg.includes('useLayoutEffect does nothing on the server')),
        );
        expect(layoutEffectWarnings).toHaveLength(0);
        expect(errorSpy).not.toHaveBeenCalled();

        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it('supports deterministic component IDs via $id, $key, and custom getNextId', () => {
        const msgBus = createMsgBus<TestMsgStruct>();

        type SimpleStruct = ComponentStruct<TestMsgStruct, {
            props: { label: string };
        }>;

        const useSimple = (params: ComponentParams<SimpleStruct>): Component<SimpleStruct> => {
            const def: ComponentDef<SimpleStruct> = {
                regType: 'SimpleBox',
                props: { label: '' },
                view: (_, c) => <div id={c.id}>{c.model.label}</div>,
            };
            return useComponent(def, params);
        };

        const SimpleBox = toReact(useSimple);

        // Test explicit $id override
        const htmlId = renderToString(
            <ComponentContextProvider value={{ msgBus }}>
                <SimpleBox label="With ID" $id="fixed-id-123" />
            </ComponentContextProvider>,
        );
        expect(htmlId).toContain('id="fixed-id-123"');

        // Test explicit $key override
        const htmlKey = renderToString(
            <ComponentContextProvider value={{ msgBus }}>
                <SimpleBox label="With Key" $key="custom-key" />
            </ComponentContextProvider>,
        );
        expect(htmlKey).toContain('id="SimpleBox#custom-key"');

        // Test custom getNextId passed via context
        const customContext = {
            msgBus,
            getNextId: (type: string) => `deterministic-${type}-static`,
        };
        const htmlCustomNextId = renderToString(
            <ComponentContextProvider value={customContext as any}>
                <SimpleBox label="Custom Next ID" />
            </ComponentContextProvider>,
        );
        expect(htmlCustomNextId).toContain('id="deterministic-SimpleBox-static"');
    });

    it('renders factory children synchronously during SSR', () => {
        const msgBus = createMsgBus<TestMsgStruct>();

        type ChildStruct = ComponentStruct<TestMsgStruct, {
            props: { text: string };
        }>;

        const useChild = (params: ComponentParams<ChildStruct>): Component<ChildStruct> => {
            const def: ComponentDef<ChildStruct> = {
                regType: 'ChildComponent',
                props: { text: '' },
                view: (_, c) => <span className="child">{c.model.text}</span>,
            };
            return useComponent(def, params);
        };

        type ParentStruct = ComponentStruct<TestMsgStruct, {
            props: { heading: string };
            children: {
                child: (params: { text: string }) => ChildStruct;
            };
        }>;

        const useParent = (params: ComponentParams<ParentStruct>): Component<ParentStruct> => {
            const def: ComponentDef<ParentStruct> = {
                regType: 'ParentComponent',
                props: { heading: '' },
                children: {
                    child: (p) => useChild(p),
                },
                view: (_, c) => (
                    <div className="parent">
                        <h2>{c.model.heading}</h2>
                        <c.children.Child text="Rendered from factory child" />
                    </div>
                ),
            };
            return useComponent(def, params);
        };

        const ParentComponent = toReact(useParent);

        const html = renderToString(
            <ComponentContextProvider value={{ msgBus }}>
                <ParentComponent heading="Parent Title" />
            </ComponentContextProvider>,
        );

        expect(html).toContain('Parent Title');
        expect(html).toContain('Rendered from factory child');
    });

    it('enforces dormant lifecycle contract: onReady and effects do not execute during renderToString', () => {
        const msgBus = createMsgBus<TestMsgStruct>();
        const lifecycleEvents: string[] = [];

        type LifecycleStruct = ComponentStruct<TestMsgStruct, {
            props: { name: string };
            effects: 'logEffect';
        }>;

        const useLifecycle = (params: ComponentParams<LifecycleStruct>): Component<LifecycleStruct> => {
            const def: ComponentDef<LifecycleStruct> = {
                regType: 'LifecycleComponent',
                props: { name: 'Initial' },
                events: {
                    onInit: () => {
                        lifecycleEvents.push('onInit');
                    },
                    onLayoutReady: () => {
                        lifecycleEvents.push('onLayoutReady');
                    },
                    onReady: () => {
                        lifecycleEvents.push('onReady');
                    },
                    onLayoutDestroy: () => {
                        lifecycleEvents.push('onLayoutDestroy');
                    },
                    onDestroy: () => {
                        lifecycleEvents.push('onDestroy');
                    },
                },
                effects: {
                    logEffect: (c) => {
                        lifecycleEvents.push('effect-run');
                        return () => {
                            lifecycleEvents.push('effect-cleanup');
                        };
                    },
                },
                view: (_, c) => <div>{c.model.name}</div>,
            };
            return useComponent(def, params);
        };

        const LifecycleComponent = toReact(useLifecycle);

        const html = renderToString(
            <ComponentContextProvider value={{ msgBus }}>
                <LifecycleComponent name="Lifecycle Test" />
            </ComponentContextProvider>,
        );

        expect(html).toContain('Lifecycle Test');

        // onInit runs synchronously during instance construction
        expect(lifecycleEvents).toContain('onInit');

        // Mount and unmount effects MUST NOT execute during SSR renderToString
        expect(lifecycleEvents).not.toContain('onLayoutReady');
        expect(lifecycleEvents).not.toContain('onReady');
        expect(lifecycleEvents).not.toContain('onLayoutDestroy');
        expect(lifecycleEvents).not.toContain('onDestroy');
        expect(lifecycleEvents).not.toContain('effect-run');
    });

    it('instantiates HttpClient safely in Node.js without window', () => {
        const msgBus = createMsgBus<TestMsgStruct>();
        const context = { msgBus };

        const client = new HttpClient(context as any);
        expect(client).toBeDefined();
        expect(client.baseUrl).toBeUndefined();

        client.baseUrl = 'http://localhost:3000';
        expect(client.baseUrl).toBe('http://localhost:3000');
    });
});
