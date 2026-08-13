# Table URL State

Table state is persisted in query params.

Current URL keys used by the table runtime are:

- layout: `l`
- pagination page index: `p.page`
- pagination page size: `p.size`
- sorting key: `s.key`
- sorting direction: `s.dir`
- full-text search: `f.search`
- UI filters:
  `f.ui.{filterKey}`
  or `f.ui.{filterKey}~{operator}`

## Current URL Shape

Example:

```txt
?l=grid&p.page=2&p.size=24&s.key=hiredAt&s.dir=desc&f.search=emma
```

This means:

- grid layout
- page 2
- page size 24
- sorted by `hiredAt`
- descending order
- search query `emma`

## Filter Serialization

UI filters use the `f.ui.*` namespace.

Schema defaults from `filter.behavior.defaultValue` remain active without producing query params. For
example, a status filter whose default is `['published']` keeps the base list URL clean:

```txt
/templates
```

Choosing Archived replaces that one default and produces:

```txt
/templates?f.ui.status=archived
```

Other filter defaults remain active, and clearing the override returns to the clean default URL.

If the active operator is the filter's default operator, the operator is omitted from the key:

```txt
?f.ui.department=Engineering
```

If the active operator is not the default operator, it is appended with `~{operator}`:

```txt
?f.ui.salary~gte=100000
```

Examples:

```txt
?f.ui.isActive=true
?f.ui.salary~between=90000,120000
?f.ui.hiredAt~after=2024-01-01T00:00:00.000Z
?f.ui.skills=TypeScript,Go
```

## What Users Should Expect

- table interactions update the URL automatically
- reloading the page preserves the same table state
- sharing the page preserves the same table state
