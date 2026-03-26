---
name: nuxt-ui-tools
description: Use this skill when working with the nuxt-ui-tools package as a consumer or integrator. It provides the current package overview, shows which surfaces are usable today, and routes you to the right package area for table, query-state, shared responsive helpers, or spreadsheet import usage.
---

# nuxt-ui-tools

Use this skill first when the task is broadly about using this package and it is not yet clear which surface matters most.

Read first:

- `skills/consumer/package/references/overview.md`

## Current Package Reality

The current serious package surfaces are:

- table runtime
- query-state runtime
- shared responsive helpers
- spreadsheet import runtime

The `form` area exists but is not yet a mature consumer surface.

## Routing

If the task is about table setup, schema design, columns, filters, layouts, or `DataList`, use:

- `skills/consumer/table/SKILL.md`

If the task is about typed URL state, query params, codecs, or reusable URL-backed state, use:

- `skills/consumer/query-state/SKILL.md`

If the task is about breakpoint-aware values driven by the current viewport, use:

- `skills/consumer/shared/SKILL.md`

If the task is about spreadsheet import flows, schema definition, matching, references, or the `SpreadsheetImport` component, use:

- `skills/consumer/spreadsheet/SKILL.md`

These sibling skills carry the feature-specific guidance.
This top-level skill is the package overview and router.

For package-wide constraints and current maturity notes, keep using:

- `skills/consumer/package/references/overview.md`
