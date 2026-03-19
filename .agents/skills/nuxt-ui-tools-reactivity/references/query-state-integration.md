# Query-State Integration

The current table/query-state integration is useful but still a known cleanup area.

## Preferred Direction

Use query-state abstractions to model grouped domain state directly.

Prefer:

- one grouped query-state abstraction for pagination
- one grouped query-state abstraction for sorting
- one dynamic query-state abstraction for runtime-defined filters
- at most one public mapping when the public surface truly needs a different shape

Avoid:

- many low-level query refs
- computed wrappers that only regroup existing refs
- repeated reshaping layers for the same domain state

## When Refactoring

Try to reduce:

- duplicated state
- manual synchronization
- computed-on-computed-on-computed chains
- unclear ownership between query-state and table state
