# Context

This file centralizes the key handoff context future agents should know before working on Data Table V2.

## Old Codebase Reference

The V1 implementation being replaced/explored lives at:

- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/AGORASTORE/NEW_STACK/tars-shared-ui/src/runtime/lib/data-list`

Future agents should inspect that codebase when they need:

- prior art
- behavior parity
- migration reference
- existing implementation details for:
  - state
  - filters
  - controls
  - actions
  - context/pageContext
  - responsive DSL

## Current Source Of Truth

Read in this order:

1. [`07-current-spec.md`](./07-current-spec.md)
2. [`08-implementation-plan.md`](./08-implementation-plan.md)
3. [`05-decisions-log.md`](./05-decisions-log.md)
4. [`session-logs/`](./session-logs/)

Use these only as supporting context:

- [`01-v1-analysis.md`](./01-v1-analysis.md)
- [`04-migration-notes.md`](./04-migration-notes.md)
- [`06-ui-direction.md`](./06-ui-direction.md)

## Non-Negotiable Priorities

- type-safety is the top priority
- performance is the other top priority
- implementation should be performant by design
- debugability is important, but should not compromise runtime discipline
- UI motion quality is high-priority during the UI phase

## Implementation Strategy

- core internals and orchestration first
- debug/inspection UI before polished UI
- UI refinement later
- one implementation step per Codex session
- every session should log its work in [`session-logs/`](./session-logs/)
- every session should keep the Nuxt playground table page updated when the current step is previewable:
  - `playgrounds/nuxt/app/pages/table.vue`
  - the page should demonstrate the fullest currently-working V2 surface so progress remains visible end to end

## Installed Skills Relevant To This Work

Installed locally:

- [/Users/cyprienthao/.codex/skills/ui-animation](/Users/cyprienthao/.codex/skills/ui-animation)
- [/Users/cyprienthao/.codex/skills/animate](/Users/cyprienthao/.codex/skills/animate)

These should be considered during the UI refinement / motion phases.

## UI References

The reference screenshots discussed during exploration were not available as local files to copy directly into the repository.

So:

- screenshot references are documented descriptively in [`06-ui-direction.md`](./06-ui-direction.md)
- future agents should use that file as the recorded visual direction unless the user provides the raw image files again

## Architecture Direction

Current architecture direction:

- one schema builder:
  - `defineTableSchema(...)`
- one runtime primitive:
  - `useTable(schema)`
- one main abstraction:
  - `DataList`
- one `table` package for now
- internal organization instead of splitting `table-core` / `table-ui` immediately

## Important Product Decisions Already Locked

- filters are top-level and split into:
  - `search`
  - `static`
  - `dynamic`
- `context` and `pageContext` are retained
- `views` and `condition` are retained
- source model uses:
  - `mode: 'client' | 'remote'`
  - `loader` xor `query`
- `client` mode expects plain arrays and no serializer
- remote mode defaults to `{ rows, rowCount }`
- toolbar supports:
  - bulk actions
  - toolbar actions
  - search
  - filter trigger
  - active filter chips on a second row

## Notes For Future Agents

- if you change a validated decision, update:
  - [`05-decisions-log.md`](./05-decisions-log.md)
  - [`07-current-spec.md`](./07-current-spec.md)
  - and the relevant session log
- if you implement a step from the plan, update:
  - [`08-implementation-plan.md`](./08-implementation-plan.md)
  - and create/update a session log file
- if the current state is previewable at all, update the playground table page in the same session:
  - `playgrounds/nuxt/app/pages/table.vue`
  - prefer one broad “full scope” playground over tiny disconnected examples
