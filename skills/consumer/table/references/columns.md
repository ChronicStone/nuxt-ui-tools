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
- `skeleton`
- `summary`

## Widths

`width` is the column's size. The header-label floor only applies to columns without a `width`, so an authored narrow numeric column stays narrow and its label truncates if needed. When all columns fit, the spare space goes to a trailing filler column: columns keep their widths, row hover and borders still span the full table, and end-pinned columns stay at the right edge.

## Loading Skeletons

`skeleton` shapes the placeholder a column draws during the first load. Pass a kind, or a config to mirror the rendered cell:

```ts
column.field('name', {
  skeleton: { kind: 'avatar', lines: 2, width: [0.5, 0.85] },
})
column.field('account.name', { skeleton: { kind: 'icon', width: [0.5, 0.85] } })
column.field('status', { skeleton: { kind: 'dot', width: [0.45, 0.6] } })
column.field('roles', { skeleton: { kind: 'badge', count: 2 } })
column.field('total', { align: 'right', skeleton: { kind: 'number', lines: 2 } })
```

Kinds: `text`, `avatar` (28px leading avatar), `icon` (18px leading icon or logo, for link cells), `dot`, `check`, `badge`, `number`, `progress`, and `none`. `lines: 2` adds a caption line, `avatar: 'circle'` rounds avatars and icons, `width` is a fixed share or a `[min, max]` range varied per row, and `count` sets the number of badges. Right-aligned columns default to `number`.

## Summary Rows

Each column can render its own footer cells. The `summary` array places one cell in each footer row; a row is shown when at least one visible column's cell passes its optional `condition`. The render context includes the typed raw query `data`, current page `rows`, `allRows` and `filteredRows` for client sources, `selectedRows`, the current `request`, `context`, and `pageContext`.

```ts
table: {
  columns: (column) => [
    column.field('invoiceNumber', {
      summary: [
        { render: () => 'Filtered total' },
        { condition: ({ selectedRows }) => selectedRows.length > 0, render: () => 'Selected' },
      ],
    }),
    column.field('total', {
      align: 'right',
      summary: [
        { render: ({ data }) => data?.summary?.total ?? '—' },
        {
          condition: ({ selectedRows }) => selectedRows.length > 0,
          render: ({ selectedRows }) => selectedRows.reduce((total, row) => total + row.total, 0),
        },
      ],
    }),
  ],
}
```

The source query determines whether `data.summary` exists and what it means. For a `drizzle-resource` query with `summary: true`, it aggregates every row matching the scope, filters, and search, independently of pagination. The table does not start an extra request for a summary cell. Footer cells retain the column's alignment and pinned position.

The earlier `summary: 'sum'` and `table.summaries` contracts remain available for existing tables. Use the array form when cells need typed query data or multiple rows.

## Wide Tables

Tables with more than 12 unpinned visible columns virtualize columns as well as rows: only the columns in view and a small overscan are mounted, and spacer cells keep the header, body, and summary row aligned. Pinned columns always render. Query a cell after scrolling its column into view.
