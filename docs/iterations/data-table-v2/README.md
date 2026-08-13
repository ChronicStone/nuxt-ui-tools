# Data Table V2

This directory contains the current exploration and implementation planning for the V2 `DataList` system.

Use these files as the source of truth:

- [`CONTEXT.md`](./CONTEXT.md): centralized handoff context for future agents
- [`07-current-spec.md`](./07-current-spec.md): current validated spec
- [`08-implementation-plan.md`](./08-implementation-plan.md): step-by-step implementation roadmap
- [`02-v2-architecture.md`](./02-v2-architecture.md): current package/runtime direction
- [`01-v1-analysis.md`](./01-v1-analysis.md): analysis of the existing V1 system

Supporting files:

- [`04-migration-notes.md`](./04-migration-notes.md): migration framing from V1 to V2
- [`05-decisions-log.md`](./05-decisions-log.md): compact current decision summary
- [`09-v1-architecture-reference.md`](./09-v1-architecture-reference.md): preserved reference for the original organization style
- [`13-granular-rendering-api-spec.md`](./13-granular-rendering-api-spec.md): draft root-and-parts rendering, UI configuration, and cursor-loading proposal

Important:

- older multi-package runtime directions have been superseded
- the canonical current source of truth is [`07-current-spec.md`](./07-current-spec.md)
- the centralized handoff context is [`CONTEXT.md`](./CONTEXT.md)
- the Nuxt playground route at `playgrounds/nuxt/app/pages/table.vue` is a required progress surface:
  - it currently demonstrates the single-package schema direction
  - runtime previews should return later, starting with query state, table context, and table data
