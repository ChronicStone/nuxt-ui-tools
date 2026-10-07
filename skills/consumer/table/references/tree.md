# Table Tree Rows

A row can hold child rows that open beneath it. The classic case is an invoice that opens to show
its credit notes. Turn it on with `table.tree`; the children travel with their parent in the same
payload.

## Example

```ts
interface Invoice {
  id: string
  number: string
  customer: string
  amount: number
  creditNotes?: Invoice[]
}

const schema = defineTableSchema({
  tableKey: 'invoices',
  rowKey: 'id',
  source: tableSource({
    mode: 'client',
    query: () => ({ queryKey: ['invoices'], queryFn: loadInvoices }),
  }),
  filters: {
    search: { fields: ['number', 'customer', 'creditNotes.number'] },
  },
  table: {
    columns: (column) => [
      column.field('number', { label: 'Document' }),
      column.field('customer', { label: 'Customer' }),
      column.field('amount', { label: 'Amount', align: 'right' }),
    ],
    tree: { children: 'creditNotes', defaultExpanded: false },
  },
})
```

## Options

- `children`: the key of each row that holds its child rows. It is typed from the row, so only keys
  that hold an array of rows are offered. A dotted path works too.
- `defaultExpanded`: which branches start open. `true` opens every branch, a number opens that many
  levels (`1` opens the top-level rows), `false` (the default) opens none.
- `selectable`: `'all'` (the default) lets every row carry a checkbox, children included, each one
  independent of its parent. `'roots'` limits the checkboxes to the top-level rows.

## What the table draws

One pinned control column carries, left to right, the rail, the chevron and the row's checkbox. The
checkbox indents with the depth. The column is as wide as the deepest loaded row needs, so every row
has the same control width and the first data column starts at the same x on all of them. The
chevron's and the checkbox's room is always kept: a row with no children, or no checkbox, leaves it
empty rather than shifting anything.

The header carries two buttons above the first row's: one opens or closes every branch, and the
select-all checkbox.

Hovering a row lights the path that leads to it, in the rows above the pointer as well.

Opening and closing play a short fade and a few pixels of slide on the rows themselves, never a
height change, so a long virtualized table stays smooth. `prefers-reduced-motion` turns it off.

Rail colour and radius follow the app theme. Override them on the table with
`--nut-dl-table-rail`, `--nut-dl-table-rail-lit` and `--nut-dl-table-rail-radius`.

## Controlling and observing expansion

`useTable(schema)` returns `expansion`, shaped like `selection`:

```ts
const table = useTable(schema)

table.expansion.expand(['INV-2041'])
table.expansion.collapse(['INV-2041'])
table.expansion.toggle({ rowId: 'INV-2041' })
table.expansion.toggle({ rowId: 'INV-2041', expanded: true })
table.expansion.expandAll() // also covers branches that load later, until collapsed again
table.expansion.collapseAll()
table.expansion.reset() // back to defaultExpanded
table.expansion.isExpanded('INV-2041')

table.expansion.state.value
// { enabled, expandedKeys, expandedCount, branchCount, allExpanded }

watch(
  () => table.expansion.state.value.expandedKeys,
  (keys) => save(keys),
)
```

`expandedKeys` lists the loaded rows that are open right now, defaults included.

## Rules and limits

- `rowKey` must be unique across the whole tree, not only among siblings. A repeated id is left out
  of the tree, with a warning in development.
- Pagination, sorting, summaries and the result count act on the top-level rows. A search or filter
  field reaches into the children with a dotted path (`creditNotes.number`), which keeps the parent
  row; children are not sorted or filtered on their own.
- Row actions run for every row, children included, with that row as `row`.
- The grid layout shows the top-level rows only.
- Selection order for a shift-click range follows the rows on screen, so a closed branch is never
  selected unseen.
