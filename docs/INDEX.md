---
protocol: along
protocol_version: "2.2.8"
slug: INDEX
title: Knowledge Base Topic Index
type: index
created: 2026-08-27
updated: 2026-09-02
tags: [index, kb, topics, map]
---

# Knowledge Base Topic Index

Central entry point and cross-linked topic catalog for @actdim/dynstruct documentation.

## Knowledge Graph & Topic Map

```mermaid
flowchart TD
    INDEX["Knowledge Base (INDEX)"]
    T_OVERVIEW["Overview & Key Advantages"]
    INDEX --> T_OVERVIEW
    T_CORE["Core Concepts"]
    INDEX --> T_CORE
    T_ARCH_WIRING["Architecture & Wiring"]
    INDEX --> T_ARCH_WIRING
    T_REACT["React Integration & Service Patterns"]
    INDEX --> T_REACT
    T_API["API Reference & Development Guide"]
    INDEX --> T_API
    T_ARCHITECTURE["Architecture"]
    INDEX --> T_ARCHITECTURE
    T_DOMAIN["Domain Model"]
    INDEX --> T_DOMAIN
    T_SETUP["Setup & Workflow"]
    INDEX --> T_SETUP
    T_OVERVIEW -.->|references| T_CORE
    T_CORE -.->|references| T_OVERVIEW
    T_CORE -.->|references| T_ARCH_WIRING
    T_ARCH_WIRING -.->|references| T_CORE
    T_ARCH_WIRING -.->|references| T_REACT
    T_REACT -.->|references| T_ARCH_WIRING
    T_REACT -.->|references| T_API
    T_API -.->|references| T_REACT
    T_ARCHITECTURE -.->|references| T_DOMAIN
    T_ARCHITECTURE -.->|references| T_SETUP
    T_ARCHITECTURE -.->|references| T_API
    T_DOMAIN -.->|references| T_ARCHITECTURE
    T_DOMAIN -.->|references| T_SETUP
    T_DOMAIN -.->|references| T_API
    T_SETUP -.->|references| T_ARCHITECTURE
    T_SETUP -.->|references| T_DOMAIN
    T_SETUP -.->|references| T_API
```

---

## Articles

- **[Overview & Key Advantages](./topic--01-overview-and-advantages.md)** (topic) `01-overview-and-advantages`
- **[Core Concepts](./topic--02-core-concepts.md)** (topic) `02-core-concepts`
- **[Architecture & Wiring](./topic--03-architecture-and-wiring.md)** (topic) `03-architecture-and-wiring`
- **[React Integration & Service Patterns](./topic--04-react-integration.md)** (topic) `04-react-integration`
- **[API Reference & Development Guide](./topic--05-api-reference.md)** (topic) `05-api-reference`
- **[Architecture](./topic--architecture.md)** (topic) `architecture`
- **[Domain Model](./topic--domain-model.md)** (topic) `domain-model`
- **[Setup & Workflow](./topic--setup-and-workflow.md)** (topic) `setup-and-workflow`

---

## Related Context

- [AGENTS.md](../AGENTS.md): Active protocol conventions and rules.
- [.along/DECISIONS.md](../.along/DECISIONS.md): Architectural Decision Records.
- [.along/ISSUES.md](../.along/ISSUES.md): Active issue tracking board.
- [.along/HISTORY.md](../.along/HISTORY.md): Append-only project history log.