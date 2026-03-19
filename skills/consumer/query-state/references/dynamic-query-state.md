# Dynamic Query State

Use `dynamicQueryState(...)` when the URL key set depends on runtime definitions.

This is useful when a static schema like:

```ts
{
  page: ...,
  size: ...,
}
```

is not enough because the keys themselves are created from runtime data.

## What It Looks Like

You provide:

- `definitions`
  the runtime definitions that describe what can exist
- `resolve`
  how each definition maps to one or more URL keys and codecs
- `parse`
  how URL entries become your domain value
- `serialize`
  how your domain value becomes URL entries again

## Concrete Example: Table Filters

The current table runtime uses dynamic query state for UI filters.

The URL namespace is:

```txt
f.ui.{filterKey}
f.ui.{filterKey}~{operator}
```

Examples:

```txt
?f.ui.department=Engineering
?f.ui.salary~gte=100000
?f.ui.hiredAt~before=2024-01-01T00:00:00.000Z
```

In that setup:

- the runtime definitions are the current filter definitions
- `resolve` decides which URL keys each filter may occupy
- `parse` turns matching URL entries into table filter rules
- `serialize` turns filter rules back into URL entries

## When To Use It

Use dynamic query state when:

- the active definitions come from runtime config
- different definitions may expose different query keys
- one domain value needs to fan out into multiple possible URL keys

## When Not To Use It

Do not use it when a fixed grouped schema is enough.

If your key set is known ahead of time, `useQueryStates(...)` is usually the better fit.
