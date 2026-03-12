# Context

This file centralizes the current V2 reset context.

## Old Codebase Reference

The V1 implementation still lives at:

- `/Users/cyprienthao/Documents/DEV/ORGANISATIONS/AGORASTORE/NEW_STACK/tars-shared-ui/src/runtime/lib/data-list`

It has been inspected specifically to preserve the proven organization style:

- `types`
- `utils`
- `composables`
- `components`
- `adapters`
- `config`

Use it as the structural reference when runtime work resumes.

## Current Source Of Truth

Read in this order:

1. [`07-current-spec.md`](./07-current-spec.md)
2. [`08-implementation-plan.md`](./08-implementation-plan.md)
3. [`02-v2-architecture.md`](./02-v2-architecture.md)
4. [`05-decisions-log.md`](./05-decisions-log.md)

## Current package direction

The architecture is now:

- `@nuxt-ui-tools/table`

Builder:

- `defineTableSchema(...)` in `table`

Async contract:

- TanStack Query options only

## Runtime note

The current runtime implementation is intentionally discarded.

The first runtime milestone is intentionally narrow:

- query state
- table context
- table data

These should be implemented iteratively and reviewed before broadening scope.
