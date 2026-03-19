# Schema And Builder Patterns

Schema-heavy features can have complex types.
That is acceptable when the complexity pays for itself in public API quality.

## Preferred Direction

- use schema values as the source of truth
- derive row, context, page-context, filter-key, and sort-key types from schema/source inputs
- keep builder contracts narrow and composable
- normalize once, then carry normalized types through the pipeline

## Good Schema-Typing Pattern

- value-level schema config
- builder helpers that preserve inference
- one resolved schema shape used by the runtime
- utility types extracted only when reused or meaningfully clarifying

## Avoid

- duplicating source row shape in multiple separate generic parameters when one can derive from another
- inventing extra exported helper types that consumers never need
- type-level cleverness with no payoff in API quality or maintainability

## Maintenance Rule

If a type is hard to explain, check whether the implementation can be simplified instead of layering more type machinery on top.
