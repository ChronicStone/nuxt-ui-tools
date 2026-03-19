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

Each filter kind accepts an optional `ui` object so you can tune the picker or input surface without dropping down into custom components.

Use the filter builder in `filters.ui`:

```ts
ui: (filter) => [
  filter.text('fullName', {
    label: 'Name',
    operators: ['contains', 'is'],
    ui: {
      placeholder: 'Search employees',
      leadingIcon: 'i-lucide-search',
      inputType: 'search',
    },
  }),
  filter.option('department.name', {
    label: 'Department',
    defaultOperator: 'isAnyOf',
    options: [
      { label: 'Engineering', value: 'Engineering' },
      { label: 'Product', value: 'Product' },
    ],
    ui: {
      searchable: false,
      selection: {
        mode: 'multiple',
      },
      row: {
        showCounts: true,
      },
    },
  }),
  filter.option('department.company.country', {
    label: 'Country',
    defaultOperator: 'isAnyOf',
    options: [
      {
        label: 'Europe',
        children: [
          { label: 'France', value: 'France' },
          { label: 'Germany', value: 'Germany' },
        ],
      },
      {
        label: 'North America',
        children: [
          { label: 'United States', value: 'United States' },
        ],
      },
    ],
    ui: {
      searchable: true,
      presentation: 'tree',
      tree: {
        selectable: 'leaf-only',
      },
      selection: {
        mode: 'multiple',
      },
    },
  }),
  filter.boolean('isActive', {
    label: 'Active',
    ui: {
      labels: {
        true: 'Online',
        false: 'Paused',
      },
    },
  }),
  filter.number('salary', {
    label: 'Salary',
    operators: ['is', 'gte', 'lte', 'between'],
    ui: {
      min: 30000,
      max: 250000,
      step: 5000,
      preview: {
        label: 'Salary',
      },
      scalar: {
        display: 'input-slider',
        preview: {
          formatter: (value) => `$${value.toLocaleString()}`,
        },
      },
      range: {
        display: 'inputs-slider',
        minGap: 10000,
        preview: {
          rangeFormatter: ({ from, to }) => `${from ?? 0} - ${to ?? 0}`,
        },
      },
    },
  }),
  filter.date('createdAt', {
    label: 'Created',
    operators: ['is', 'before', 'after', 'between'],
    ui: {
      preview: {
        label: 'Created',
      },
      scalar: {
        display: 'calendar',
        presets: [
          {
            label: 'Today',
            value: ({ now }) => {
              const value = new Date(now)
              value.setHours(0, 0, 0, 0)
              return value
            },
          },
          {
            label: 'Start of month',
            value: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1),
            operators: ['before', 'after', 'is'],
          },
        ],
        preview: {
          formatter: (value) => value.toLocaleDateString(),
        },
      },
      range: {
        display: 'inputs-calendar',
        presetsPlacement: 'side',
        presets: [
          {
            label: 'Last 7 days',
            value: ({ now }) => {
              const from = new Date(now)
              from.setDate(from.getDate() - 6)
              from.setHours(0, 0, 0, 0)

              const to = new Date(now)
              to.setHours(23, 59, 59, 999)

              return { from, to }
            },
          },
        ],
        calendar: {
          months: 1,
          pagedNavigation: true,
          fixedWeeks: true,
        },
        preview: {
          rangeFormatter: ({ from, to }) =>
            [from, to].filter(Boolean).map(value => value!.toLocaleDateString()).join(' - '),
        },
      },
    },
  }),
]
```

Common examples:

- `text.ui`: `placeholder`, `leadingIcon`, `inputType`, `commitMode`
- `option.ui`: `searchable`, `closeOnSelect`, `selection.mode`, `row`, `preview`, `operators`
- `option.ui.presentation = 'tree'` switches the option picker to a hierarchical tree
- `option.ui.tree.searchMode` controls whether tree search is local or remote
- `boolean.ui`: `labels`, `icons`, `selection`, `preview`, `operators`
- `number.ui`: `min`, `max`, `step`, `scalar`, `range`, `preview`, `operators`
- `date.ui`: `scalar`, `range`, `preview`, `operators`
- `number.ui.preview` and `date.ui.preview` can format scalar/range values with formatter functions

Operator-aware config is layered:

- base config at `ui`
- semantic branch config at `ui.scalar` or `ui.range` when relevant
- exact operator overrides at `ui.operators.<operator>`

Resolution order is:

- base
- scalar/range
- operator override

Date filter defaults:

- built-in scalar presets for single-date operators
- built-in range presets such as `Last 7 days`
- range calendars default to `1` month when not configured

Set `ui.scalar.presets = false` or `ui.range.presets = false` to remove built-in shortcuts. The older date-only `picker` config is still supported for backward compatibility, but new configs should use `ui`.

Tree option filters:

- tree filters use the same `filter.option(...)` builder
- option entries can include `children`
- tree search is deep by default and auto-expands matching ancestor paths
- use `ui.tree.searchMode = 'remote'` when your remote option query already filters server-side
- use `ui.tree.searchMode = 'local'` when you fetch the whole tree and want local deep filtering in the picker

## Remote Option Query Example

```ts
filter.option('departmentId', {
  label: 'Department',
  defaultOperator: 'isAnyOf',
  query: ({ search, limit, cursor }) => ({
    queryKey: ['department-options', search, limit, cursor],
    queryFn: async () => api.departmentOptions({ search, limit, cursor }),
  }),
  ui: {
    searchable: true,
    closeOnSelect: false,
    selection: {
      mode: 'multiple',
    },
    labels: {
      searchPlaceholder: 'Pick departments',
    },
  },
})
```

## URL Examples

```txt
?f.ui.fullName=Emma
?f.ui.department.name=Engineering
?f.ui.salary~gte=100000
?f.ui.isActive=true
```
