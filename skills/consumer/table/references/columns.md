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

## Summary Row

Give a column a `summary` to add a sticky totals row under the table. Use a kind (`sum`, `avg`, `count`, `min`, `max`) or a config with `resolve`, `format`, and `render` for derived or dual-currency values, and choose the rows it covers with `table.summaries`:

```ts
table: {
  summaries: { scope: 'page', scopes: ['page', 'selection'] },
  columns: (column) => [
    column.field('invoiceNumber', { label: 'Invoice' }),
    column.field('total', { align: 'right', summary: 'sum' }),
  ],
}
```

`scope` is `filtered` (the whole query; remote sources resolve it through `summaries.resolve`), `page`, or `selection`. The first column without a summary shows the scope and the row count, for example "Page 50 rows". When `selection` is one of the `scopes`, selecting rows switches the totals to the selection until it is cleared. Totals use the same cell padding as the body, so they align with the values above them.

For a remote filtered total, `summaries.resolve` receives the current typed table request. Convert it with `toTableRemoteSourceRequest(request)` before sending it to a server summary endpoint; this keeps the footer's filters and search aligned with the rows. Return a record keyed by column ID. The resolver runs once for the summary row, so one server request can supply several totals.

## Wide Tables

Tables with more than 12 unpinned visible columns virtualize columns as well as rows: only the columns in view and a small overscan are mounted, and spacer cells keep the header, body, and summary row aligned. Pinned columns always render. Query a cell after scrolling its column into view.
