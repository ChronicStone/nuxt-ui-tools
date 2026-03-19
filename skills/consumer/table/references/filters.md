# Table Filters

Current filter surface:

- `filters.search`
- `filters.static`
- `filters.ui`

## Search

```ts
filters: {
  search: {
    fields: ['fullName', 'email', 'department.company.name', 'skills'],
    placeholder: 'Search employees...',
  },
}
```

URL result:

```txt
?f.search=emma
```

## UI Filters

Current built-in kinds:

- text
- option
- boolean
- number
- date

Use the filter builder in `filters.ui`:

```ts
ui: (filter) => [
  filter.text('fullName', {
    label: 'Name',
    operators: ['contains', 'is'],
  }),
  filter.option('department.name', {
    label: 'Department',
    defaultOperator: 'isAnyOf',
    options: [
      { label: 'Engineering', value: 'Engineering' },
      { label: 'Product', value: 'Product' },
    ],
  }),
  filter.boolean('isActive', {
    label: 'Active',
  }),
  filter.number('salary', {
    label: 'Salary',
    operators: ['is', 'gte', 'lte', 'between'],
  }),
]
```

## Remote Option Query Example

```ts
filter.option('departmentId', {
  label: 'Department',
  defaultOperator: 'isAnyOf',
  query: ({ search, limit, cursor }) => ({
    queryKey: ['department-options', search, limit, cursor],
    queryFn: async () => api.departmentOptions({ search, limit, cursor }),
  }),
})
```

## URL Examples

```txt
?f.ui.fullName=Emma
?f.ui.department.name=Engineering
?f.ui.salary~gte=100000
?f.ui.isActive=true
```
