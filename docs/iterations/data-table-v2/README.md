# Data Table V2

This directory contains the current exploration and implementation planning for the V2 `DataList` system.

Use these files as the source of truth:

- [`CONTEXT.md`](./CONTEXT.md): centralized handoff context for future agents
- [`07-current-spec.md`](./07-current-spec.md): current validated spec
- [`08-implementation-plan.md`](./08-implementation-plan.md): step-by-step implementation roadmap
- [`06-ui-direction.md`](./06-ui-direction.md): visual direction and UI references
- [`01-v1-analysis.md`](./01-v1-analysis.md): analysis of the existing V1 system

Supporting files:

- [`04-migration-notes.md`](./04-migration-notes.md): migration framing from V1 to V2
- [`05-decisions-log.md`](./05-decisions-log.md): compact current decision summary

Important:

- older exploratory directions have been cleaned up
- the canonical current source of truth is [`07-current-spec.md`](./07-current-spec.md)
- the centralized handoff context is [`CONTEXT.md`](./CONTEXT.md)
- the Nuxt playground route at `playgrounds/nuxt/app/pages/table.vue` is a required progress surface:
  - every implementation session should update it when the current step exposes anything meaningful to preview
  - the playground should aim to exercise the broadest currently-supported V2 table surface, not a tiny isolated subset
