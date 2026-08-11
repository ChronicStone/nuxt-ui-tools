# Table Filters

Current filter surface:

- `filters.search`
- `filters.static`
- `filters.ui`

Built-in UI filter kinds:

- text
- option
- boolean
- number
- date

## Unified Filter Shape

UI filters now use one shared top-level structure:

- `label`
- `behavior`
- `display`
- `source`
- `editor`
- `preview`

Use the builder in `filters.ui`:

```ts
filters: {
  search: {
    fields: ['fullName', 'email', 'department.company.name', 'skills'],
    placeholder: 'Search employees...',
  },
  ui: (filter) => [
    filter.text('fullName', {
      label: 'Name',
      behavior: {
        operators: ['contains', 'is'],
        defaultOperator: 'contains',
      },
      display: {
        location: 'panel md:tag',
      },
      editor: {
        placeholder: 'Search employees',
        leadingIcon: 'i-lucide-search',
        inputType: 'search',
      },
      preview: {
        label: 'Name',
      },
    }),
    filter.option('department.name', {
      label: 'Department',
      behavior: {
        defaultOperator: 'isAnyOf',
      },
      display: {
        location: 'panel md:tag',
      },
      source: {
        facet: 'exclude-self',
        options: [
          { label: 'Engineering', value: 'Engineering' },
          { label: 'Product', value: 'Product' },
        ],
      },
      editor: {
        searchable: false,
        selection: {
          mode: 'multiple',
        },
        tree: {
          branchSelection: 'children',
        },
      },
      preview: {
        label: 'Department',
      },
    }),
  ],
}
```

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

## Meaning Of Each Section

### `behavior`

`behavior` controls filter semantics:

- available operators
- default operator
- default value
- commit mode for direct filter editors
- whether changing operator clears the current value

Example:

```ts
behavior: {
  operators: ['is', 'isAnyOf', 'isNot'],
  defaultOperator: 'isAnyOf',
  commitMode: 'manual',
  clearOnOperatorChange: true,
}
```

Important rule:

- filters rendered in the panel always use panel-level staged apply
- `behavior.commitMode` matters for direct surfaces such as tag and tag-dynamic editors

### `display`

`display` controls where a filter renders:

```ts
display: {
  location: 'panel md:tag',
}
```

Supported locations:

- `tag`
- `panel`
- `tag-dynamic`

Responsive values use the shared responsive string syntax:

- `'panel md:tag'`
- `'tag lg:panel'`
- `'tag-dynamic md:tag'`

Location affects presentation, not query state. If a filter moves from panel to tag at a breakpoint, its applied value stays intact.

### `source`

`source` is where option/facet data lives. It is only relevant for option and boolean filters.

```ts
source: {
  options: [
    { label: 'Engineering', value: 'Engineering' },
    { label: 'Product', value: 'Product' },
  ],
  facet: 'exclude-self',
}
```

Available source responsibilities:

- static options with `options`
- remote option loading with `query`
- facet counts with `facet`
- option ordering with `sort`

Important rule:

- option loading and facet counts are separate concerns
- `source.query` loads available options
- `source.facet` enables counts

If you want counts in either client or remote mode, opt in with `source.facet`.

### `editor`

`editor` controls the actual input or picker UI for the filter kind.

Examples:

- `text.editor`: placeholder, icon, input type
- `option.editor`: searchable, tree, selection, row labels
- `boolean.editor`: labels, icons, selection
- `number.editor`: min, max, step, scalar/range UI
- `date.editor`: scalar/range display, presets, calendar config

### `preview`

`preview` controls how the active filter is summarized in tags and compact surfaces.

Examples:

```ts
preview: {
  label: 'Salary',
}
```

```ts
preview: {
  formatter: (value) => `$${value.toLocaleString()}`,
  rangeFormatter: ({ from, to }) => `${from ?? 0} - ${to ?? 0}`,
}
```

## Option Filters

Tree-specific option editor settings:

- `editor.tree.selectable`: `'all' | 'leaf-only'`
- `editor.tree.searchMode`: `'auto' | 'local' | 'remote'`
- `editor.tree.branchSelection`: `'off' | 'children'`

`branchSelection: 'children'` means non-value branch rows in multi-select trees get a checkbox that selects or clears all selectable descendants. This is the default.

Flat option filter:

```ts
filter.option('department.name', {
  label: 'Department',
  behavior: {
    defaultOperator: 'isAnyOf',
  },
  display: {
    location: 'panel md:tag',
  },
  source: {
    facet: 'exclude-self',
    options: [
      { label: 'Engineering', value: 'Engineering' },
      { label: 'Product', value: 'Product' },
    ],
  },
  editor: {
    searchable: false,
    selection: {
      mode: 'multiple',
    },
  },
})
```

Tree option filter:

```ts
filter.option('department.company.country', {
  label: 'Country',
  behavior: {
    defaultOperator: 'isAnyOf',
  },
  display: {
    location: 'panel md:tag',
  },
  source: {
    facet: 'exclude-self',
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
        children: [{ label: 'United States', value: 'United States' }],
      },
    ],
  },
  editor: {
    searchable: true,
    closeOnSelect: false,
    presentation: 'tree',
    tree: {
      selectable: 'leaf-only',
      searchMode: 'local',
    },
    selection: {
      mode: 'multiple',
    },
    labels: {
      searchPlaceholder: 'Select countries',
    },
  },
})
```

Remote option query example:

```ts
filter.option('departmentId', {
  label: 'Department',
  behavior: {
    defaultOperator: 'isAnyOf',
  },
  display: {
    location: 'panel md:tag',
  },
  source: {
    facet: true,
    query: ({ search, limit, cursor }) => ({
      queryKey: ['department-options', search, limit, cursor],
      queryFn: async () => api.departmentOptions({ search, limit, cursor }),
    }),
  },
  editor: {
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

## Boolean Filters

```ts
filter.boolean('isActive', {
  label: 'Active',
  display: {
    location: 'panel md:tag',
  },
  source: {
    facet: 'exclude-self',
  },
  editor: {
    labels: {
      true: 'Online',
      false: 'Paused',
    },
  },
})
```

## Number Filters

```ts
filter.number('salary', {
  label: 'Salary',
  behavior: {
    operators: ['is', 'gte', 'lte', 'between'],
  },
  display: {
    location: 'panel md:tag',
  },
  editor: {
    min: 30000,
    max: 250000,
    step: 5000,
    scalar: {
      display: 'input-slider',
    },
    range: {
      display: 'inputs-slider',
      minGap: 10000,
    },
  },
  preview: {
    label: 'Salary',
    formatter: (value) => `$${value.toLocaleString()}`,
    rangeFormatter: ({ from, to }) => `${from ?? 0} - ${to ?? 0}`,
  },
})
```

## Date Filters

```ts
filter.date('createdAt', {
  label: 'Created',
  behavior: {
    operators: ['is', 'before', 'after', 'between'],
  },
  display: {
    location: 'panel md:tag',
  },
  editor: {
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
      ],
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
    },
  },
  preview: {
    label: 'Created',
    formatter: (value) => value.toLocaleDateString(),
    rangeFormatter: ({ from, to }) =>
      [from, to]
        .filter(Boolean)
        .map((value) => value!.toLocaleDateString())
        .join(' - '),
  },
})
```

Date defaults:

- built-in scalar presets for single-date operators
- built-in range presets such as `Last 7 days`
- range calendars default to `1` month when not configured

Set `editor.scalar.presets = false` or `editor.range.presets = false` to remove built-in shortcuts.

## Facets And Counts

Facet counts are separate from option loading.

Client mode:

- the client query engine computes facet counts from the in-memory dataset
- counts only exist for filters with `source.facet`

Remote mode:

- the server owns facet computation through `source.facets(...)`
- counts only exist for filters with `source.facet`

This means these two concerns stay independent:

- `source.query`: where options come from
- `source.facet`: whether counts are requested

## URL Examples

```txt
?f.ui.fullName=Emma
?f.ui.department.name=Engineering
?f.ui.salary~gte=100000
?f.ui.isActive=true
```
