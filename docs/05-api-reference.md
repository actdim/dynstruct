# API Reference & Development Guide

[← Back to 04. React Integration](./04-react-integration.md) | [Back to Main README](../README.md)

---

## Core Types Reference

### `ComponentStruct<TMsgStruct, TStruct>`
Base generic interface defining component type contracts.

```typescript
type ComponentStruct<TMsgStruct, TStructDef> = {
    msg: TMsgStruct;
    props: TStructDef['props'];
    actions: TStructDef['actions'];
    children: TStructDef['children'];
    msgScope: TStructDef['msgScope'];
    effects: TStructDef['effects'];
};
```

### `ComponentDef<TStruct>`
Implementation definition passed to `useComponent`:

```typescript
type ComponentDef<TStruct> = {
    regType?: string;
    props?: TStruct['props'];
    actions?: TStruct['actions'];
    effects?: Record<string, (c: Component<TStruct>) => void | (() => void)>;
    children?: Record<string, Component<any>>;
    events?: ComponentEvents<TStruct>;
    msgBroker?: ComponentMsgBroker<TStruct>;
    msgBus?: MsgBusInstance;
    view: () => JSX.Element;
    fallbackView?: (props: any, c: Component<TStruct>) => JSX.Element;
};
```

### `Component<TStruct>`
Instance interface returned by `useComponent`:

- `c.id`: Runtime unique identifier.
- `c.model`: Reactive model instance (access props as `c.model.propName`).
- `c.children`: Child component view slots.
- `c.msgBus`: Lifecycle-scoped message bus.
- `c.validate(propPath?)`: Run property validators.
- `c.mapToEdit(propPath)`: Generate input binding props.
- `c.getParent()`, `c.getChainUp()`, `c.getChainDown()`: Hierarchy access methods.

---

## Storybook Integration

`dynstruct` components can be documented and tested visually using Storybook.

Run Storybook locally:

```bash
pnpm run storybook
```

Build Storybook static site:

```bash
pnpm run build-storybook
```

Example Storybook story:

```typescript
import { Meta, StoryObj } from '@storybook/react';
import { Counter } from './Counter';

const meta: Meta<typeof Counter> = {
    title: 'ComponentModel/Counter',
    component: Counter,
};
export default meta;

export const Default: StoryObj<typeof Counter> = {
    args: {
        counter: 10,
    },
};
```

---

## Development & Testing

### Running Unit Tests

Run Vitest unit tests:

```bash
pnpm run test
```

Watch mode:

```bash
pnpm run test:w
```

React environment tests:

```bash
pnpm run test:react
```

### Type Checking & Linting

```bash
pnpm run typecheck
pnpm run lint
```

---

## License

Proprietary / BUSL-1.1 (Business Source License). See `LICENSE` for details.

---

[← Back to 04. React Integration](./04-react-integration.md) | [Back to Main README](../README.md)

