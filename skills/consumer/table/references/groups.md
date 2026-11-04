# Table Row Groups

Rows that share a value gather under a header row that folds them. Turn it on with
`table.groupBy`, and with `grid.groupBy` for cards. Each view sets its own; the shape is the same.

## Example

```ts
const groupBy = {
  key: 'family',
  label: ({ value }) => value ?? 'Other',
}

const schema = defineTableSchema({
  tableKey: 'exams',
  rowKey: 'id',
  source: tableSource({ mode: 'remote', query }),
  table: { groupBy, columns },
  grid: { groupBy, renderItem },
})
```

## Options

- `key`: a row field path, or a function for a value the row does not hold as a field
- `label`: the header's text; defaults to the value, or the locale's "Other" for rows with none
- `summary`: shown next to the label; defaults to the number of rows
- `order`: values listed here come first, in this order; the rest follow by value, with numbers
  read as numbers, and empty values last
- `collapsed`: `true`, or a function of the group, to start folded

## What it does on its own

- The whole header row folds the group, and the chevron is its keyboard control.
- With selection on, the table's header row carries a checkbox for the whole group, mixed when only
  some rows are selected. Cards have no checkboxes, so their headers have none either.
- A column sort applies inside each group, and the groups keep their order.
- A shift-click range runs over the rows in the order they show and skips folded groups.
- What the reader folds is remembered per `tableKey`, unless `persistence.preferences` is `false`.

## Limits

- Groups cover the rows that are loaded. A remote source needs a page large enough to hold a whole
  group, otherwise a group splits across pages and its count covers the current page only.
- Grouping is one level. `table.groupBy` is ignored with `table.tree`, which has its own hierarchy.
- Summary rows (`table.summary`) stay flat.
