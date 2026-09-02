# API Reference & Development Guide

[← Back to 04. React Integration](./04-react-integration.md) | [Back to Main README](../README.md)

---

## Core Types Reference

### `ComponentStruct<TMsgStruct, TStructDef>`
Base generic type defining component structural contracts (pure type declaration, no implementation):

```typescript
type ComponentStruct<
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
    TStructDef extends ComponentStructBase<TMsgStruct> = ComponentStructBase<TMsgStruct>,
> = TStructDef & {
    msg: TMsgStruct;
};

// Shape of TStructDef:
type ComponentStructBase<TMsgStruct> = {
    props?: Record<string, any>;
    actions?: Record<string, Function>;
    effects?: string[] | string;
    children?: Record<string, ComponentStruct<any> | Function>;
    msgScope?: {
        subscribe?: keyof TMsgStruct;
        publish?: keyof TMsgStruct;
        provide?: keyof TMsgStruct;
    };
};
```

### `ComponentDef<TStruct, TMsgHeaders>`
Implementation definition passed to `useComponent`:

```typescript
type ComponentDef<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    regType?: string;
    props?: ComponentProps<TStruct['props']>;
    actions?: TStruct['actions'];
    effects?: Record<TStruct['effects'][number], (c: Component<TStruct, TMsgHeaders>) => void | (() => void)>;
    children?: ComponentDefChildren<TStruct['children']>;
    events?: ComponentEvents<TStruct, TMsgHeaders>;
    msgBroker?: ComponentMsgBroker<TStruct, TMsgHeaders>;
    msgBus?: MsgBus<TStruct['msg'], TMsgHeaders>;
    view?: (props: ComponentViewProps, c?: Component<TStruct, TMsgHeaders>) => unknown;
    fallbackView?: (props: ComponentViewProps, c?: Component<TStruct, TMsgHeaders>) => unknown;
    useErrorBoundary?: boolean;
};
```

### `Component<TStruct, TMsgHeaders>`
Instance interface returned by `useComponent`:

- **Identity & Tree**:
  - `c.id`: Runtime unique identifier.
  - `c.key`: Component key.
  - `c.regType`: Registered type name.
  - `c.parentId`: Parent component ID.
  - `c.getParent()`, `c.getChildren()`, `c.getChainUp()`, `c.getChainDown()`, `c.getNodeMap()`, `c.getHierarchyId()`: Tree navigation methods.
- **Model & State**:
  - `c.model`: Reactive model instance (access props and actions directly, e.g. `c.model.counter`).
  - `c.model.$`: Component runtime state (`isDisabled`, `isReadOnly`, `isVisible`, `isValid`, `pendingRequestCount`, `errors`, `propState`).
- **Communication & Lifecycle**:
  - `c.msgBus`: Lifecycle-scoped message bus wrapper (auto-unwraps MobX observables, manages `abortSignal`, sets `headers.sourceId`).
  - `c.msgBroker`: Message broker configuration.
  - `c.abortSignal`: Lifecycle `AbortSignal` triggered on unmount.
  - `c.effects`: Effect controllers with `.pause()`, `.resume()`, and `.stop()`.
- **Rendering & Forms**:
  - `c.View`: React component view slot (`<c.View />`).
  - `c.children`: Child component view slots.
  - `c.validate(propPath?)`: Run property validators.
  - `c.mapToEdit(propPath?, exclude?)`: Generate two-way form input bindings (`value`, `onChange`, `onBlur`).
  - `c.run(handler, silent)`: Executes async handlers within component error and pending request tracking.
  - `c[Symbol.dispose]()`: Manual disposal cleanup.

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

