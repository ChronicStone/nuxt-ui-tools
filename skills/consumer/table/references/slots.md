# DataList Slots

Current `DataList` slot names are:

- `title`
- `actions`
- `empty`
- `empty-table`
- `empty-grid`

## Example

```vue
<DataList :table="table" title="Employees">
  <template #actions>
    <UButton label="Refresh" />
  </template>

  <template #empty>
    <div>No employees found.</div>
  </template>
</DataList>
```

Use slots when you want to customize the rendered shell without rebuilding the table state or table schema yourself.
