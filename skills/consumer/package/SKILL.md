---
name: nuxt-ui-tools
description: Use this skill when working with the nuxt-ui-tools package as a consumer or integrator. It provides the current package overview, shows which surfaces are usable today, and routes you to the right package area for table, form, query-state, shared responsive helpers, or i18n usage.
---

# nuxt-ui-tools

Use this skill first when the task is broadly about using this package and it is not yet clear which surface matters most.

Read first:

- `skills/consumer/package/references/overview.md`

## Current Package Reality

The current serious package surfaces are:

- table runtime
- form runtime
- query-state runtime
- shared responsive helpers

## Routing

If the task is about table setup, schema design, columns, filters, layouts, or `DataList`, use:

- `skills/consumer/table/SKILL.md`

If the task is about schema-driven forms, inline form rendering, provider-owned modal/drawer forms, or `useFormApi`, use:

- `skills/consumer/form/SKILL.md`

If the task is about typed URL state, query params, codecs, or reusable URL-backed state, use:

- `skills/consumer/query-state/SKILL.md`

If the task is about breakpoint-aware values driven by the current viewport, use:

- `skills/consumer/shared/SKILL.md`

If the task is about package locale wiring, `UiToolsProvider`, or translation-friendly schema text, use:

- `skills/consumer/i18n/SKILL.md`

These sibling skills carry the feature-specific guidance.
This top-level skill is the package overview and router.

For package-wide constraints and current maturity notes, keep using:

- `skills/consumer/package/references/overview.md`
