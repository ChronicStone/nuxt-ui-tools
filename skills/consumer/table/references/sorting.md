# Table Sorting

Sorting can be configured at layout level and on columns.

## Default Sorting

```ts
table: {
  defaultSorting: {
    key: 'hiredAt',
    dir: 'desc',
  },
}
```

```ts
grid: {
  defaultSorting: {
    key: 'fullName',
    dir: 'asc',
  },
}
```

## Composite Sort Key

```ts
column.composite('skillsSummary', {
  label: 'Skills',
  sortableKey: 'fullName',
  render: ({ row }) => row.skills.join(', '),
})
```

## URL Result

```txt
?s.key=hiredAt&s.dir=desc
```
