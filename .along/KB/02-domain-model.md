---
protocol: along
slug: 02-domain-model
title: 02 Domain Model
type: topic
created: 2026-08-27
updated: 2026-08-27
tags: []
---

# @actdim/dynstruct Domain Model & Type Contracts

## 1. Domain Types Overview

The domain model of `@actdim/dynstruct` defines the structural scaffolding, runtime definitions, models, bindings, and message routing contracts.

## 2. Core Entities & Type Contracts

### 2.1. Structural Scaffolding (`ComponentStruct`)
```typescript
import { BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';
import { ComponentStruct, ComponentRefStruct } from '@actdim/dynstruct/componentModel/contracts';

export type UserProfileStruct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: {
            username: string;
            email: string;
            isEditing: boolean;
        };
        actions: {
            save: () => Promise<void>;
            cancel: () => void;
        };
        children: {
            avatar: AvatarStruct;
            saveBtn: ButtonStruct;
            cancelBtn: ButtonStruct;
        };
        msgScope: {
            subscribe: 'USER.DATA_UPDATED';
            publish: 'UI.NOTIFY';
            provide: 'USER.GET_EDIT_DATA';
        };
        effects: ['syncRemoteState', 'trackEdits'];
    }
>;
```

### 2.2. Runtime Definition (`ComponentDef<TStruct>`)
The implementation object passed to `useComponent`:
- `regType: string`: Component identifier used for tree registration and DOM ID generation.
- `props: TStruct['props']`: Initial reactive state.
- `actions?: TStruct['actions']`: Action method implementations.
- `events?: ComponentEvents<TStruct>`:
  - `onChange<PropName>?: (oldVal, newVal) => void`
  - `onInit?: () => void`
  - `onReady?: () => void`
  - `onDestroy?: () => void`
  - `onError?: (err: Error) => void`
- `children?: { [K in keyof TStruct['children']]: Component<TStruct['children'][K]> }`: Instantiated child hook-constructors.
- `msgScope?: { subscribe?, publish?, provide? }`: Message bus handlers.
- `effects?: EffectDef[]`: Reactive effect observers.
- `view: () => ReactNode`: Render function returning JSX.

### 2.3. Two-Way Data Binding (`Binding`)
- **`bind<T, TFrom>(get: () => T, set?: (v: T) => void, converter?: ValueConverter<T, TFrom>): Binding`**: Creates two-way getter/setter binding.
- **`bindProp<T extends object, P extends KeyPath<T>>(target: () => T, path: P): Binding`**: Creates deep dot-notation property binding.

### 2.4. Component State Helper (`$`)
Accessible on `c.model.$`:
- `$.id: string`: Unique component instance ID.
- `$.regType: string`: Component type name.
- `$.parent?: Component<any>`: Parent component reference.
- `$.propState: Record<string, ComponentPropState>`: Validation state, error messages, and dirty flags.
- `$.isReady: boolean`: Lifecycle readiness status.

### 2.5. Directional Message Filtering (`ComponentMsgFilter`)
- `ComponentMsgFilter.None = 0`
- `ComponentMsgFilter.FromAncestors = 1 << 0`: Accepts messages only dispatched from parent/ancestor components in the tree.
- `ComponentMsgFilter.FromDescendants = 1 << 1`: Accepts messages only dispatched from child/descendant components in the tree.

### 2.6. Service Provider Contracts (`ServiceProvider`)
- **`StorageService`**: Dexie/IndexedDB storage adapter.
- **`NavService`**: React Router navigation adapter (`navigate`, `location`, route parameters).
- **`SecurityService`**: Authentication domain (`AuthInfo`, `login`, `logout`, `refreshToken`, JWT token claims).

## 3. Cross-Links
- [[INDEX.md]] - Knowledge Base Root
- [[01-architecture.md]] - System Architecture
- [[03-setup-and-workflow.md]] - Setup, Build & Storybook Workflow
- [[04-api-reference.md]] - API Reference
- [[05-patterns-and-recipes.md]] - Practical Recipes and Storybook Examples
