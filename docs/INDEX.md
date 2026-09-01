---
protocol: along
protocol_version: "2.2.13"
slug: INDEX
title: Knowledge Base Topic Index
type: index
created: 2026-09-02
updated: 2026-09-02
tags: [index, kb, topics, map]
---

# Knowledge Base Topic Index

Central entry point and cross-linked topic catalog for project documentation:

## Knowledge Graph & Topic Map

```mermaid
flowchart TD
    INDEX["Knowledge Base (INDEX)"]
    T_01_OVERVIEW_AND_ADVANTAGES["Overview & Key Advantages"]
    INDEX --> T_01_OVERVIEW_AND_ADVANTAGES
    T_02_CORE_CONCEPTS["Core Concepts"]
    INDEX --> T_02_CORE_CONCEPTS
    T_03_ARCHITECTURE_AND_WIRING["Architecture & Wiring"]
    INDEX --> T_03_ARCHITECTURE_AND_WIRING
    T_04_REACT_INTEGRATION["React Integration & Service Patterns"]
    INDEX --> T_04_REACT_INTEGRATION
    T_05_API_REFERENCE["API Reference & Development Guide"]
    INDEX --> T_05_API_REFERENCE
    T_ARCHITECTURE["01 Architecture"]
    INDEX --> T_ARCHITECTURE
    T_DOMAIN_MODEL["02 Domain Model"]
    INDEX --> T_DOMAIN_MODEL
    T_SETUP_AND_WORKFLOW["03 Setup And Workflow"]
    INDEX --> T_SETUP_AND_WORKFLOW
    T_01_OVERVIEW_AND_ADVANTAGES -.->|references| T_02_CORE_CONCEPTS
    T_02_CORE_CONCEPTS -.->|references| T_01_OVERVIEW_AND_ADVANTAGES
    T_02_CORE_CONCEPTS -.->|references| T_03_ARCHITECTURE_AND_WIRING
    T_03_ARCHITECTURE_AND_WIRING -.->|references| T_02_CORE_CONCEPTS
    T_03_ARCHITECTURE_AND_WIRING -.->|references| T_04_REACT_INTEGRATION
    T_04_REACT_INTEGRATION -.->|references| T_03_ARCHITECTURE_AND_WIRING
    T_04_REACT_INTEGRATION -.->|references| T_05_API_REFERENCE
    T_05_API_REFERENCE -.->|references| T_04_REACT_INTEGRATION
```

---

## Articles

- **[Overview & Key Advantages](./topic--01-overview-and-advantages.md)** (topic) `01-overview-and-advantages`
- **[Core Concepts](./topic--02-core-concepts.md)** (topic) `02-core-concepts`
- **[Architecture & Wiring](./topic--03-architecture-and-wiring.md)** (topic) `03-architecture-and-wiring`
- **[React Integration & Service Patterns](./topic--04-react-integration.md)** (topic) `04-react-integration`
- **[API Reference & Development Guide](./topic--05-api-reference.md)** (topic) `05-api-reference`
- **[01 Architecture](./topic--architecture.md)** (topic) `architecture`
- **[02 Domain Model](./topic--domain-model.md)** (topic) `domain-model`
- **[03 Setup And Workflow](./topic--setup-and-workflow.md)** (topic) `setup-and-workflow`

---

## Related Context

- [AGENTS.md](../AGENTS.md): Active protocol conventions and rules.
- [.along/DECISIONS.md](../.along/DECISIONS.md): Architectural Decision Records.
- [.along/ISSUES.md](../.along/ISSUES.md): Active issue tracking board.
- [.along/HISTORY.md](../.along/HISTORY.md): Append-only project history log.
