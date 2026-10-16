---
protocol: along
protocol_version: "4.4.16"
slug: agent-native-metadata-and-contracts
type: task
status: open
priority: high
created: 2026-10-16
updated: 2026-10-16
agent: antigravity
tags: [agent, ai, dynstruct, metadata, llms]
milestone: v2.0.0
parent: task--agent-native-ecosystem-standardization
blocked_by: []
related: []
---

# Agent-native metadata, llms.txt golden rules, and JSDoc contracts for Dynstruct

## Purpose and Scope

`@actdim/dynstruct` is the structural foundation of the Actdim UI ecosystem. For AI coding agents, Dynstruct transforms React development from an open-ended, bug-prone task into a deterministic, schema-driven implementation.

This task specifies the exact changes required in `@actdim/dynstruct` to position it as a first-class Agent-Native library, ensuring AI assistants generate valid component declarations on their first attempt without falling into React hook traps.

---

## 1. Package Manifest (`package.json`)

Update the package manifest with agent-native metadata:

- **`description`**:
  ```text
  "Deterministic, agent-native component model for React and TypeScript with explicit structural contracts, zero hook-ordering traps, and decoupled state."
  ```

- **`keywords`**:
  Add agent and structure keywords while retaining existing identifiers:
  ```json
  [
    "agent-native",
    "ai-ready",
    "llm-friendly",
    "structured-ui",
    "component-model",
    "declarative-state",
    "anti-spaghetti",
    "typescript",
    "react",
    "type-safe",
    "event-driven",
    "clean-architecture"
  ]
  ```

- **`ai` and `llms` fields**:
  Ensure published npm tarball exposes AI entrypoints:
  ```json
  "llms": "./llms.txt",
  "ai": {
    "instructions": "./AGENTS.md",
    "docs": "./docs",
    "llms": "./llms.txt",
    "llms-full": "./llms-full.txt"
  }
  ```

- **`files` array**:
  Confirm that `llms.txt`, `llms-full.txt`, and `AGENTS.md` are included so agents inspecting `node_modules` can read them.

---

## 2. Standardization of `llms.txt`

Restructure `llms.txt` following the llmstxt.org standard with three mandatory sections:

### Section A: Overview and Core Contract
Concise summary describing what Dynstruct does and why the contract exists.

### Section B: The Five Golden Rules for AI Agents
1. **Model-View Separation**:
   Views are pure projections over `c.model`. NEVER mutate state or run business logic directly in JSX view functions.
2. **Default Props Isolation**:
   In `def.props`, provide initial fallback values only. NEVER read `params.xyz` inside `def.props` (the runtime merges caller params automatically).
3. **React Hook Isolation**:
   NEVER call standard React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) inside `ComponentDef`. State belongs in `props`, reactivity belongs in `effects`, event handling belongs in `actions`.
4. **Two-Way Binding Convention**:
   Always connect child structs to parent models using `bindProp(() => m, 'propertyName')`.
5. **Child Classification**:
   Distinguish between Dynstruct hook-constructor children (e.g. `valueInput: TextFieldStruct` created with `useTextField(...)`) and lightweight view fragments (`summary: React.FC`).

### Section C: Canonical Implementation Template
Provide a complete, zero-hallucination snippet that an agent can copy and adapt:

```tsx
import React from 'react';
import {
  ComponentStruct,
  ComponentParams,
  ComponentModel,
  ComponentDef,
  Component,
  useComponent,
  bindProp,
} from '@actdim/dynstruct';

export type CounterStruct = ComponentStruct<never, {
  props: {
    count: number;
    label?: string;
  };
  actions: {
    increment: () => void;
    reset: () => void;
  };
  children: {};
  effects: 'logOnChange';
}>;

export const useCounter = (params: ComponentParams<CounterStruct>) => {
  let c: Component<CounterStruct>;
  let m: ComponentModel<CounterStruct>;

  const def: ComponentDef<CounterStruct> = {
    props: {
      count: 0,
      label: 'Counter',
    },
    actions: {
      increment: () => { m.count += 1; },
      reset: () => { m.count = 0; },
    },
    children: {},
    effects: {
      logOnChange: () => {
        // Reactive effect triggered when m.count changes
      },
    },
    view: () => (
      <div>
        <span>{m.label}: {m.count}</span>
        <button onClick={c.actions.increment}>+</button>
        <button onClick={c.actions.reset}>Reset</button>
      </div>
    ),
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};
```

---

## 3. In-Source JSDoc Annotations

Add rich JSDoc tags to core exported symbols in `src/` to guide agents via Language Server Protocol (LSP):

- **`ComponentStruct`**: Document type layout with `@example` showing `props`, `actions`, `children`, and `effects`.
- **`ComponentDef`**: Add `@agentNotice` warnings forbidding React hooks inside definition objects.
- **`bindProp`**: Document two-way binding usage with `@example` showing getter closure and key name.
- **`useComponent`**: Document hook initialization and reference assignment sequence.

---

## Acceptance Criteria

- [ ] `package.json` updated with agent-native description and keywords.
- [ ] `llms.txt` updated to llmstxt.org format with Golden Rules and canonical snippet.
- [ ] Core symbols annotated with JSDoc `@example` and `@agentNotice` tags.
- [ ] All vitest suites pass without regression (`pnpm test`).
