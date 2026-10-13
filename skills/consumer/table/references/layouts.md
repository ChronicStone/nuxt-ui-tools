# Table Layouts

Current layout surface:

- `defaultLayout`
- `table`
- `grid`

## Default Layout

```ts
defaultLayout: 'table'
```

or:

```ts
defaultLayout: 'grid'
```

## Table Layout Config

```ts
table: {
  defaultSorting: {
    key: 'hiredAt',
    dir: 'desc',
  },
  columns: (column) => [
    column.field('fullName', { label: 'Employee' }),
  ],
}
```

## Grid Layout Config

```ts
grid: {
  enabled: true,
  gridSize: 3,
  itemSize: 'md',
  defaultSorting: {
    key: 'fullName',
    dir: 'asc',
  },
  renderItem: ({ row }) => `${row.fullName} - ${row.department.name}`,
}
```

## Common Dual-Layout Setup

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  defaultLayout: 'table',
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryKey: ['employees'],
      queryFn: async () => rows,
    }),
  }),
  table: {
    columns: (column) => [
      column.field('fullName', { label: 'Employee' }),
      column.field('email', { label: 'Email' }),
    ],
  },
  grid: {
    enabled: true,
    gridSize: 3,
    renderItem: ({ row }) => `${row.fullName} - ${row.email}`,
  },
})
```

When the active layout changes, the table runtime keeps using the same table instance and updates URL-backed layout state through the `l` query param.

## Responsive Layouts

`table.enabled` and `grid.enabled` accept responsive values. Disabling the table below a breakpoint switches phones to the grid while desktop keeps the table and the layout toggle:

```ts
table: {
  enabled: 'false md:true',
  columns: (column) => [/* ... */],
},
grid: {
  gridSize: '1 md:2 xl:3',
  renderItem: ({ row }) => h(EmployeeCard, { employee: row }),
},
```

## Summary Rows

A column table on a phone is a sideways scroll. `table.summary` reads each record as one compact row instead: an identity, one status, a couple of values worth reading without opening the record, and the row actions. Search, filters, selection, row actions, and pagination work as in the table, and a toggle brings the full table back.

```ts
table: {
  columns: (column) => [/* ... */],
  summary: {
    leading: ({ row }) => h(UAvatar, { text: initials(row.name), size: 'md' }),
    title: ({ row }) => row.name,
    status: ({ row }) => h(UBadge, { label: STATUS[row.status], variant: 'soft' }),
    details: ({ row }) => [row.kind, row.city],
    to: ({ row }) => `/accounts/${row.id}`,
  },
},
```

Summary rows are off until `table.summary` exists. Every callback receives the params a grid card gets (`row`, `index`, `context`, `pageContext`, `tableApi`) with `layout: 'table'`.

| Field      | Renders                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| `title`    | The identity: one line, cut with an ellipsis. Required.                                                |
| `leading`  | A 32px rounded tile before the title (initials, an icon, an avatar). Pass something that fills it.     |
| `status`   | One pill, first on the line under the title.                                                           |
| `details`  | Values after the status, joined with `·`. `null`, `undefined`, `false`, and `''` are skipped.          |
| `to`       | Makes the row a link to the record. Return `undefined` for a row that goes nowhere.                    |
| `onSelect` | Runs when the row is tapped, before the navigation when `to` is also set.                              |
| `enabled`  | Where summary rows replace the table: `true`, `false`, a responsive string, or a getter returning one. |

`enabled` defaults to `'true md:false'`: summary rows below the `md` breakpoint, the table from `md` up. Responsive strings read the app's viewport breakpoints, which are Tailwind's by default (`sm` 640, `md` 768, ...). The unprefixed token binds to the smallest breakpoint, so `'true sm:false'` cannot express "below 640px". Declare a smaller key in `viewport.breakpoints` (for example `xs: 0`) and write `'true sm:false'` to switch at 640px.

The reader can switch views. The toggle is a text button naming the other view (`Vue tableau` while summary rows show, `Vue liste` while the table shows). It sits between the range and the pager of the offset footer, and in the toolbar next to the layout switch for cursor and unpaginated lists, where there is no footer. The choice is remembered in the `${tableKey}::view` cookie (the key URI-encoded) unless `persistence.preferences` is `false`, and then it lasts for the session. A page can place the toggle itself with `<UiDataListViewToggle />`, hide it with `controls: { summary: false }`, or drive the view through `table.summary`:

```ts
table.summary.state.value // { active: boolean, available: boolean }
table.summary.set(false) // show the full table
```

What changes while summary rows are active:

- The column panel is replaced by the sort menu, because rows have no column headers to sort by. The sort menu lists the sortable columns.
- Column pinning, resizing, and the totals row (`table.summaries`) are not shown. Tree tables (`table.tree`) keep the table, because the rail and chevrons live in the tree column.
- Rows are white (`bg-default`) with a hairline between them, never on the page's tint, and virtualize from 40 rows.
- Record names for assistive technology follow `rowLabel`; see `selection.md`.

Tune the rows through `ui.summary` on the root. Slots are `root`, `viewport`, `header` (the select-all strip), `list`, `row`, `select`, `main`, `leading`, `body`, `title`, `meta`, `status`, `details`, `actions`, `skeleton`, and `loadingMore`. Row states read the CSS variables `--nut-dl-summary-row-hover`, `--nut-dl-summary-row-pressed`, and `--nut-dl-summary-row-selected`.

```vue
<UiDataListRoot
  :table="table"
  :ui="{
    summary: { ui: { title: 'text-sm', leading: 'rounded-full' } },
    viewToggle: { props: { button: { color: 'neutral' } } },
  }"
/>
```

## First-Use Empty State

A list with no record at all can invite the first one. A list hidden by a search or a filter always offers to reset them instead, whatever `empty` says.

```ts
empty: {
  icon: 'i-lucide-building-2',
  title: () => t('accounts.empty.title'),
  description: () => t('accounts.empty.description'), // `false` hides the line
  action: {
    label: () => t('accounts.empty.action'),
    icon: 'i-lucide-plus',
    to: '/accounts/new', // or onClick: () => openCreateDialog()
  },
},
```

`action` takes any Nuxt UI button prop, plus a lazy `label` and `onClick`. Anything left out keeps the localized default, and `ui.table.props.empty` on the root holds app-wide defaults that a schema's own `empty` overrides field by field. The same state shows in the table, summary rows, and the grid.
