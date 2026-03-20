# Table Actions

Action-related schema sections are:

- `actions`
- `toolbarActions`
- `rowActions`

## Row Actions

`rowActions` defines per-row actions once on the schema.

When `rowActions` is present:

- the table injects a dedicated actions column automatically when at least one current row resolves a visible action
- that synthetic column is pinned to the right by default
- grid cards can consume the same resolved actions with `<RowActions>`
- you do not pass `row` or precomputed `actions` manually into `<RowActions>`

## Typical Setup

```ts
const schema = defineTableSchema({
  tableKey: 'employees',
  rowKey: 'id',
  source: {
    mode: 'client',
    query: () => ({
      queryKey: ['employees'],
      queryFn: async () => rows,
    }),
  },
  rowActions: ({ row, tableApi, layout }) => [
    {
      key: 'open-profile',
      label: 'Open profile',
      icon: 'i-lucide-user-round',
      action: async () => {
        await navigateTo(`/employees/${row.id}`)
      },
    },
    {
      key: row.isActive ? 'pause' : 'resume',
      label: row.isActive ? 'Pause employee' : 'Resume employee',
      icon: row.isActive ? 'i-lucide-pause' : 'i-lucide-play',
      action: () => {
        tableApi.updateRow({
          ...row,
          isActive: !row.isActive,
        })
      },
    },
    {
      key: 'refresh',
      label: 'Refresh table',
      icon: 'i-lucide-refresh-cw',
      condition: () => layout === 'grid',
      action: () => tableApi.refresh(),
    },
  ],
  table: {
    columns: (column) => [column.field('fullName', { label: 'Employee' })],
  },
})
```

## Grid Card Usage

Inside a grid card rendered by the same table, use `<RowActions>` as a lightweight Nuxt UI dropdown wrapper:

```vue
<RowActions>
  <UButton
    color="neutral"
    variant="ghost"
    icon="i-lucide-ellipsis-vertical"
    size="sm"
    square
  />
</RowActions>
```

`<RowActions>` does not render its own trigger. It wraps the trigger you provide and resolves the current row actions from parent table scope automatically.

## Supported Row Action Shape

`rowActions` stays close to Nuxt UI dropdown items and adds table-specific behavior:

```ts
rowActions: ({ row, tableApi }) => [
  {
    key: 'copy-email',
    label: 'Copy email',
    icon: 'i-lucide-copy',
    action: async () => {
      await navigator.clipboard.writeText(row.email)
    },
  },
  {
    key: 'danger-zone',
    label: 'Danger zone',
    icon: 'i-lucide-triangle-alert',
    children: [
      {
        key: 'delete',
        label: 'Delete employee',
        color: 'error',
        action: async () => {
          await deleteEmployee(row.id)
          await tableApi.refresh()
        },
      },
    ],
  },
]
```

Useful fields include:

- `key`
- `label`
- `icon`
- `color`
- `avatar`
- `slot`
- `class`
- `ui`
- `children`
- `condition`
- `disabled`
- `loading`
- `action`

`condition`, `disabled`, and `loading` can be booleans or callbacks.

If every resolved row action is hidden for the current rows:

- the synthetic actions column is omitted in table mode
- `<RowActions>` renders nothing, so your trigger disappears automatically

## Row Action Context

Row action callbacks receive:

- `row`
- `context`
- `pageContext`
- `tableApi`
- `layout`

This makes it easy to branch on the active layout, page context, or update the current row in place.

## Table API Helpers

Useful helpers for row actions include:

- `tableApi.refresh()`
- `tableApi.updateRow(row)`
- `tableApi.updateRows(rows)`

These helpers are also available under `tableApi.data`, but the top-level methods are usually the most convenient in actions.

## When To Use Each Section

- `actions`: bulk actions that depend on selected rows
- `toolbarActions`: actions shown at the table level
- `rowActions`: per-row actions shown in the synthetic row-actions column and reusable through `<RowActions>`
