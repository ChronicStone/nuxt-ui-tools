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
  defaultValue: ['active'],
  commitMode: 'manual',
  clearOnOperatorChange: true,
}
```

`defaultValue` defines the effective baseline state. It applies when the URL has no override and stays
omitted from the URL while unchanged, but it does not count as an active filter in tags, panel badges,
the public `filters.activeCount`, or filtered empty states. Editors still open with the default value
selected. Any value or operator that differs from the baseline is active, and clearing the filter
restores its schema default.

When several filters declare defaults, an explicit URL value overrides only its own definition; the
other defaults remain effective without becoming active. Panel clear actions restore these defaults
instead of leaving defaulted filters empty.

Important rule:

- drawer panels default to staged apply; granular panels choose `live` or `submit` with `commit-mode`
- `behavior.commitMode` matters for direct surfaces such as tag and tag-dynamic editors

## Granular Raw Filter Panel

`<UiDataListFilterPanel mode="panel" />` renders the filter fields inline, without a
slideover, so the page owns the surrounding layout. Use `commit-mode="live"` for
immediate query updates or `commit-mode="submit"` to stage edits until Apply:

```vue
<aside class="w-72">
  <UiDataListFilterPanel mode="panel" commit-mode="live" />
</aside>
```

Submit mode keeps edits in the panel draft; Clear resets the draft to configured
defaults and Apply commits it. Live mode applies field changes immediately and
does not render an Apply footer. The same options can be supplied through the
`DataListRoot` `ui.filterPanel` config when a shared composition should use one
mode consistently.

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
- remote option loading in one request with `query`
- remote options loaded page by page with `remote` (takes precedence over `options` and `query`)
- facet counts with `facet`
- option ordering with `sort`

Important rule:

- option loading and facet counts are separate concerns
- `source.query` and `source.remote` load available options
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

Remote option query example (the whole list in one request):

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

### Remote Paginated Options

Use `source.remote` when a list is too long to load at once (users, companies, projects). It follows the form engine's remote options and the shared `RemoteOptionsResult` contract:

```ts
filter.option('ownerId', {
  label: 'Owner',
  editor: { searchable: true, selection: { mode: 'multiple' }, row: { showCounts: true } },
  source: {
    remote: {
      // One page for a search term: `page.index` (1-based) or `page.cursor`, plus `page.size`.
      load: ({ search, page }) => ({
        queryKey: ['owners', search, page.index, page.size],
        queryFn: () => api.owners.search({ search, page: page.index, size: page.size }),
        // → { options, hasMore } for page pagination, { options, nextCursor } for cursor pagination
      }),
      // Options of selected values the loaded pages do not contain (e.g. restored from the URL).
      resolveSelected: ({ values }) => ({
        queryKey: ['owners', 'selected', values],
        queryFn: () => api.owners.byIds(values),
      }),
      pagination: { type: 'page', size: 25 }, // default; `prefetchDistance` tunes loading ahead
      search: { debounce: 250, minLength: 0 }, // defaults
    },
    // Counts come from the filter's own facet query, one request per loaded page.
    facet: {
      mode: 'exclude-self',
      query: ({ facets, table }) => ({
        queryKey: ['owner-counts', facets, table.filters, table.search],
        queryFn: () => api.owners.counts({ values: facets[0]?.values ?? [], table }),
      }),
    },
  },
})
```

When the options come from an endpoint that speaks the table request protocol (a remote table's
own endpoint), `remoteTableOptions` builds the whole source: requests with the search fields, the
sort, and cursor or offset pages, rows mapped to options, and selected values resolved by an
`isAnyOf` filter on `valueKey`:

```ts
source: {
  remote: remoteTableOptions({
    query: (request) => $api.users.query.queryOptions({ body: request }),
    search: ['name', 'email'],
    sort: 'name',
    option: (user) => ({ label: user.name, value: user.id }),
    valueKey: 'id', // default
    pagination: { type: 'cursor', size: 25 }, // default; match what the endpoint pages by
  }),
},
```

The same source fits dashboard remote params (`p.remote(source)`) and form remote options
(`{ mode: 'remote', source: options.load, resolveSelected: options.resolveSelected, pagination:
options.pagination }`).

Behavior:

- nothing loads until an editor shows the list; each search term keeps its own cached pages
- the search runs on the server, debounced; the previous results stay on screen while the next term loads
- the next page loads ahead of the scroll (three viewport heights by default, set `pagination.prefetchDistance` in pixels to change it); there is no "load more" button, and a failed page offers an inline retry
- tags, panel chips, and the mobile sheet show labels for committed values through `resolveSelected` (and `prefetchTable` warms that query for values in the URL); without it such values show as their raw value
- picked values stay listed at the top of the editor, even when the current search does not return them

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

- `source.query` / `source.remote`: where options come from
- `source.facet`: whether counts are requested

Paginated options (`source.remote`) on a remote table:

- the main request cannot count options it never lists, so these filters never take counts from `source.facets(...)`
- give the filter its own `source.facet.query`: the table calls it once per loaded page, with that page's values in `facets[0].values`, and once for committed values the pages do not list
- values the response leaves out count `0`; a row shows a placeholder until its page is counted
- in client mode, counts still come from the in-memory rows

## URL Examples

```txt
?f.ui.fullName=Emma
?f.ui.department.name=Engineering
?f.ui.salary~gte=100000
?f.ui.isActive=true
```
