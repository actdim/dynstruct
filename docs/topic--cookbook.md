---
protocol: along
slug: cookbook
title: "Cookbook: Recipes for Common Tasks"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, recipes, how-to]
---

# Cookbook: Recipes for Common Tasks

Short, task-oriented recipes. Each one answers one "I want to ..." question with working code, a
short explanation, the usual mistakes, and links to the reference pages and to the Storybook /
demo source it was taken from.

The reference pages ([Core Concepts](topic--02-core-concepts.md),
[React Integration](topic--04-react-integration.md), [API Reference](topic--05-api-reference.md))
explain how things work; the cookbook shows how to get a task done.

## Sections

| Page | What is inside |
|---|---|
| [Component Basics](topic--cookbook-components.md) | define a component, private internals, defaults vs params, lifecycle, ids, bus at the root, reactivity modes, React content in props, **the two kinds of `children`** |
| [Data Flow & Bindings](topic--cookbook-data-flow.md) | parent to child, two-way binding, converters, child to parent over the bus, calling a child, reacting to changes, effects, computed props, external stores |
| [Forms & Validation](topic--cookbook-forms-validation.md) | inputs, field rules, showing errors, UI-kit fields, submit, cross-field and async rules, server errors, reset |
| [Composition, Lists & Dialogs](topic--cookbook-composition.md) | sections, child components, lists, conditional parts, dialogs, slots, big arrays, MUI kit |
| [Messaging (MsgMesh)](topic--cookbook-messaging.md) | custom channels, `msgScope`, send, subscribe, request/provide, subtree scoping, headers, replay, topics, toasts, the bus outside dynstruct |
| [Services & API Calls](topic--cookbook-services.md) | adapters, calling methods, `HttpClient`, loading state, search as you type, service components, storage, config |
| [Navigation & Auth](topic--cookbook-auth-navigation.md) | typed routes, navigating, links, current location, sign-in/out, protected pages, built-in and custom auth |
| [Errors & Testing](topic--cookbook-errors-testing.md) | where errors go, `onCatch`, fallback views, global error overlay, tests with a real bus |

## I want to ...

| Task | Recipe |
|---|---|
| create a component | [1.1](topic--cookbook-components.md#_1-1-define-a-component) |
| hide internal state from callers | [1.2](topic--cookbook-components.md#_1-2-keep-internals-private-componentstructext) |
| understand `c.children` vs `props.children` | [1.10](topic--cookbook-components.md#_1-10-two-kinds-of-children) |
| pass a value from parent to child | [2.1](topic--cookbook-data-flow.md#_2-1-pass-a-value-down-parent-to-child-read-only) |
| let a child edit the parent's value | [2.2](topic--cookbook-data-flow.md#_2-2-two-way-binding-bindprop) |
| tell the parent that something happened in a child | [2.5](topic--cookbook-data-flow.md#_2-5-child-tells-the-parent-something-intent-over-the-bus) |
| reload data when inputs change | [2.8](topic--cookbook-data-flow.md#_2-8-reload-when-inputs-change-effect) |
| validate a field | [3.2](topic--cookbook-forms-validation.md#_3-2-add-a-field-rule-required-format) |
| validate the whole form on submit | [3.5](topic--cookbook-forms-validation.md#_3-5-validate-everything-before-submit) |
| show server errors under fields | [3.9](topic--cookbook-forms-validation.md#_3-9-put-server-errors-into-the-form) |
| render a list of components | [4.3](topic--cookbook-composition.md#_4-3-render-a-list-of-child-components) |
| open a dialog | [4.5](topic--cookbook-composition.md#_4-5-parent-controlled-dialog), [4.6](topic--cookbook-composition.md#_4-6-global-dialog-opened-over-the-bus) |
| define my own bus channels | [5.1](topic--cookbook-messaging.md#_5-1-declare-the-app-s-bus-custom-message-struct) |
| call an API | [6.1](topic--cookbook-services.md#_6-1-expose-a-service-class-as-bus-channels-adapters), [6.2](topic--cookbook-services.md#_6-2-call-a-service-method) |
| show a loading indicator | [6.5](topic--cookbook-services.md#_6-5-show-a-loading-indicator) |
| navigate to another page | [7.2](topic--cookbook-auth-navigation.md#_7-2-navigate-from-a-component) |
| require a signed-in user | [7.6](topic--cookbook-auth-navigation.md#_7-6-protect-a-page) |
| handle errors | [8.2](topic--cookbook-errors-testing.md#_8-2-handle-errors-in-one-place-oncatch) |
| test a component | [8.6](topic--cookbook-errors-testing.md#_8-6-test-a-component-with-a-real-bus-and-fake-services) |

## The skeleton every recipe assumes

```tsx
import type { Component, ComponentDef, ComponentModel, ComponentParams, ComponentStruct } from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';
import { bind, bindProp, prop } from '@actdim/dynstruct/componentModel/core';

type MyStruct = ComponentStruct<AppMsgStruct, {
    props: { value: string };
    actions: { clear: () => void };
    children: { summary: React.FC };
}>;

export const useMy = (params: ComponentParams<MyStruct>): Component<MyStruct> => {
    let c: Component<MyStruct>;
    let m: ComponentModel<MyStruct>;

    const def: ComponentDef<MyStruct> = {
        props: { value: '' },                        // defaults only
        actions: { clear: () => { m.value = ''; } }, // called as m.clear()
        children: { summary: () => <span>{m.value.length} chars</span> },
        view: () => (
            <div id={c.id}>
                <input {...c.mapToEdit('value')} />
                <c.children.Summary />
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export const My = toReact(useMy); // for the boundary with plain React only
```

`AppMsgStruct` is the app's bus type ([5.1](topic--cookbook-messaging.md#_5-1-declare-the-app-s-bus-custom-message-struct)).

## Five rules that prevent most bugs

1. **Lazy access in `def`.** `c` and `m` are `undefined` while `def` is built: pass
   `bind(() => m.x)`, `bindProp(() => m, 'x')`, `bindField(() => c, 'x')`, never `m.x`.
2. **Defaults in `def.props`, inputs through params.** Never read `params.x` in the
   hook-constructor; a plain param is an initial value, a binding is live.
3. **Children in `def.children`.** Render nested dynstruct components as `<c.children.Name />`,
   not as JSX tags with props in `view`.
4. **Bus instead of callback props.** Components tell each other things through typed channels
   (`c.msgBus.send`, `msgBroker.subscribe`), not through `onSelect` / `onClose` props.
5. **Logic in actions.** Put behavior in `def.actions` (errors routed, writes batched) and call
   `m.action()` from the view.

## Where the recipes come from

- Storybook stories: `src/_stories/componentModel/` (run `pnpm storybook`).
- Tests: `tests/react/`.
- The demo portal: `demo/src/` ([Live Demo](https://actdim.github.io/dynstruct/demo/)).
- The mempart webapp, a production app built on dynstruct.
