# Migration Notes

This file captures the current migration framing from V1 to V2.

## Naming Direction

- keep `defineTableSchema(...)`
- keep `tableKey`
- keep `rowKey`
- keep `table`
- keep `grid`
- keep `defaultLayout`
- keep `actions`
- keep `rowActions`
- keep `context`
- keep `pageContext`

## Intentional Structural Changes

- move to one schema builder instead of split table/query builders
- unify source model under:
  - `mode: 'client' | 'remote'`
  - `loader` xor `query`
- move filters to:
  - `filters.search`
  - `filters.static`
  - `filters.dynamic`
- use builder callback API for:
  - columns
  - dynamic filters
- move toward:
  - `column.field`
  - `column.composite`
  - `column.display`

## Migration Focus

Priority migration areas:

- source model
- filter model
- context/pageContext lifecycle
- persistence
- actions reuse
- table/grid layout parity

## Deferred Areas

- tree mode
- inline editable columns
- cursor pagination
- header drag-and-drop reorder
