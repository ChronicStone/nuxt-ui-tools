# Table Columns

Current column kinds:

- field
- composite
- display

Use the column builder in `table.columns`:

```ts
columns: (column) => [
  column.field('fullName', {
    label: 'Employee',
    minWidth: 260,
  }),
  column.composite('skillsSummary', {
    label: 'Skills',
    render: ({ row }) => row.skills.join(', '),
  }),
]
```

## Field Columns

```ts
column.field('salary', {
  label: 'Salary',
  align: 'right',
  render: ({ value }) => formatCurrency(Number(value ?? 0)),
})
```

## Composite Columns

```ts
column.composite('skillsSummary', {
  label: 'Skills',
  sortableKey: 'fullName',
  render: ({ row }) => row.skills.join(', '),
})
```

## Display Columns

```ts
column.display('statusBadge', {
  label: 'Status',
  render: ({ row }) => (row.isActive ? 'Online' : 'Paused'),
})
```

## Common Options

Column options currently include things like:

- `label`
- `icon`
- `width`
- `minWidth`
- `maxWidth`
- `sortable`
- `pinned`
- `align`
- `labelAlign`
- `ellipsis`
- `resizable`
- `condition`
- `enabled`
- `required`
- `visible`
