---
protocol: along
slug: INDEX
title: '@actdim/dynstruct-demo - Knowledge Base Topic Index'
type: index
created: 2026-11-01
updated: 2026-11-03
tags: [index, kb, topics, map]
---

# @actdim/dynstruct-demo - Knowledge Base Topic Index

Central entry point and cross-linked topic catalog for project documentation:

## Knowledge Graph & Topic Map

```mermaid
flowchart TD
    INDEX["Knowledge Base (INDEX)"]
    T_ALONG_PROTOCOL["Along Protocol Reference"]
    INDEX --> T_ALONG_PROTOCOL
    T_ARCHITECTURE["Architecture"]
    INDEX --> T_ARCHITECTURE
    T_DOMAIN_MODEL["Domain Model"]
    INDEX --> T_DOMAIN_MODEL
    T_SETUP_AND_WORKFLOW["Setup And Workflow"]
    INDEX --> T_SETUP_AND_WORKFLOW
    T_ARCHITECTURE -.->|references| T_DOMAIN_MODEL
    T_ARCHITECTURE -.->|references| T_SETUP_AND_WORKFLOW
    T_DOMAIN_MODEL -.->|references| T_ARCHITECTURE
    T_DOMAIN_MODEL -.->|references| T_SETUP_AND_WORKFLOW
    T_SETUP_AND_WORKFLOW -.->|references| T_ARCHITECTURE
    T_SETUP_AND_WORKFLOW -.->|references| T_DOMAIN_MODEL
```

---

## Articles

- **[Along Protocol Reference](./topic--along-protocol.md)** (reference) `protocol`, `agents-md`, `checklist`, `routing`, `concurrency`, `along-team`, `conventions`
- **[Architecture](./topic--architecture.md)** (architecture) `architecture`, `astro`, `islands`, `msgmesh`, `dynstruct`, `ssg`, `base-path`
- **[Domain Model](./topic--domain-model.md)** (domain-model) `domain-model`, `msgmesh`, `channels`, `contracts`, `catalog`, `routes`
- **[Setup And Workflow](./topic--setup-and-workflow.md)** (setup-workflow) `setup-and-workflow`, `build`, `test`, `e2e`, `github-pages`, `ci`, `monorepo`

---

## Related Context

- [AGENTS.md](../AGENTS.md): Active protocol conventions and rules.
- [Decisions (ADRs)](./decisions/INDEX.md): Architectural Decision Records.
- [Domain Model & Entity Ecosystem](./topic--domain-model.md): Specifications for active issues and project history.
