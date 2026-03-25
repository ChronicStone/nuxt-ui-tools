# Spreadsheet Import Reset

This directory replaces the previous bad proposal with a usage-first reset.

The target is not "a Vue port of react-spreadsheet-import".
The target is a schema-based spreadsheet import runtime that:

- keeps the functional strength of `react-spreadsheet-import`
- keeps the DX direction of this repository's table engine
- stays inference-first
- stays config-driven and modular
- gives consumers a lot of power without forcing them into a giant prop bag

Read in this order:

1. `CONTEXT.md`
2. `API-PROPOSAL.md`
3. `ARCHITECTURE.md`
4. `SCHEMA-SPEC.md`
5. `IMPLEMENTATION-PLAN.md`
6. `UI-DESIGN-BRIEF.md`

Core direction:

- public flow should feel like table:
  define schema -> create runtime -> render UI
- imperative runtime entry should also exist for app-level usage:
  `$spreadsheetApi.start(schema, ...)`
- non-vital steps must be skippable
- matching must be smarter than static alternate labels
- parsing, matching, validation, and UI must be separate ownership layers
- async and remote behavior should use the same query-definition mindset as table
- runtime-defined column groups must be first-class, not a hack
