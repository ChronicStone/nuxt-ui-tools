# Filter Architecture Proposal

This file proposes the next filter API and runtime architecture.

The purpose is to:

- unify the filter schema surface
- decouple filter semantics from rendering location
- support multiple filter presentation modes cleanly
- reorganize filter components so the system scales to new filter types without copy-paste growth

This proposal assumes breaking changes are allowed.
It does not try to preserve the current filter API shape.

## Core Goals

The next filter system should satisfy these rules:

1. a filter is defined once with one unified API
2. filter state is canonical and independent from rendering location
3. moving a filter between `tag`, `panel`, and `tag-dynamic` must not lose state
4. filter presentation should be a rendering concern, not a query-state concern
5. component structure must be reusable and type-oriented, not tag-oriented
6. adding a new filter kind should mostly mean:
   - add one normalized definition branch
   - add one editor implementation
   - add one preview implementation if needed
   not rewrite orchestration

## Design Summary

The filter model should be split into explicit concerns:

- semantics:
  what the filter means and how it behaves logically
- source:
  where option/facet data comes from when relevant
- display:
  where the filter is rendered in the table UX
- editor:
  how the editing UI behaves and looks
- preview:
  how applied values are summarized

The current `ui` bucket is too broad and should be removed.

## Proposed Consumer API

### Shared shape

All UI filters should use the same top-level sections:

```ts
filter.text('title', {
  label: 'Title',

  behavior: {
    operators: ['contains', 'is'],
    defaultOperator: 'contains',
    commitMode: 'manual',
    clearOnOperatorChange: true,
    reopenOnOperatorChange: false,
  },

  display: {
    location: 'tag-dynamic md:tag',
    order: 10,
    group: 'main',
  },

  editor: {
    placeholder: 'Search title',
    leadingIcon: 'i-lucide-search',
    inputType: 'search',
  },

  preview: {
    mode: 'tags',
    label: 'Title',
  },
})
```

### Option filter example

```ts
filter.option('status', {
  label: 'Status',

  behavior: {
    operators: ['is', 'isAnyOf', 'isNot'],
    defaultOperator: 'isAnyOf',
    commitMode: 'manual',
  },

  display: {
    location: 'panel lg:tag',
    order: 20,
    group: 'workflow',
    panel: {
      section: 'Workflow',
    },
  },

  source: {
    options: [
      { label: 'Todo', value: 'todo' },
      { label: 'In Progress', value: 'in_progress' },
    ],
    facet: 'exclude-self',
    sort: 'count',
  },

  editor: {
    searchable: true,
    closeOnSelect: false,
    presentation: 'list',
    selection: {
      mode: 'multiple',
    },
    row: {
      showCounts: true,
    },
    labels: {
      searchPlaceholder: 'Search statuses',
    },
  },

  preview: {
    mode: 'tags',
    maxTags: 2,
  },
})
```

### Date filter example

```ts
filter.date('startDate', {
  label: 'Start date',

  behavior: {
    operators: ['is', 'before', 'after', 'between'],
    defaultOperator: 'between',
    commitMode: 'manual',
  },

  display: {
    location: 'panel md:tag-dynamic',
    order: 40,
    group: 'planning',
  },

  editor: {
    scalar: {
      display: 'calendar',
      presets: [
        {
          label: 'Today',
          value: ({ now }) => now,
        },
      ],
    },
    range: {
      display: 'inputs-calendar',
      presetsPlacement: 'side',
      calendar: {
        months: 1,
        fixedWeeks: true,
      },
    },
  },

  preview: {
    label: 'Start date',
  },
})
```

## Proposed Top-Level Sections

### `label`

Purpose:

- user-facing filter name

Shared across all filter kinds.

### `behavior`

Purpose:

- semantic operator behavior
- filter state behavior

Suggested shared fields:

```ts
type TableFilterBehavior = {
  operators?: TableFilterOperator[]
  defaultOperator?: TableFilterOperator
  commitMode?: 'auto' | 'manual'
  clearOnOperatorChange?: boolean
  reopenOnOperatorChange?: boolean
}
```

Important rule:

- `commitMode` applies only to direct filter editing surfaces
- panel-rendered filters always use panel-level staged commit

### `display`

Purpose:

- where the filter is rendered in the table UI

Suggested shared fields:

```ts
type TableFilterLocation = 'tag' | 'panel' | 'tag-dynamic'

type TableFilterLocationValue =
  | TableFilterLocation
  | string
  | Partial<Record<'mobile' | 'sm' | 'md' | 'lg' | 'xl', TableFilterLocation>>

type TableFilterDisplayConfig = {
  location?: TableFilterLocationValue
  order?: number
  group?: string
  triggerLabel?: TableTextValue
  panel?: {
    section?: string
    title?: TableTextValue
  }
}
```

### `source`

Purpose:

- provide external/static/filter-option-specific data sources

Only relevant for some kinds, especially option filters.

Suggested option-filter source fields:

```ts
type TableOptionFilterSource = {
  options?: TableFilterOptionEntry[]
  query?: (...)
  facet?: true | 'exclude-self' | 'include-self'
  sort?: 'label' | 'count'
}
```

### `editor`

Purpose:

- actual control configuration for editing the filter value

This replaces the current broad `ui` section.

The outer name stays consistent.
The inner shape remains kind-specific.

### `preview`

Purpose:

- describe how applied values are summarized

This should be a consistent surface across filter kinds.

## Presentation Modes

### `tag`

Definition:

- filter is rendered directly in the filter bar

Behavior:

- may be visible even when inactive
- can commit using the filter's direct editing behavior

### `panel`

Definition:

- filter is edited inside a shared filter drawer

Behavior:

- not rendered inline as a normal editable tag
- panel edits are always staged
- apply/clear happens at the panel level
- per-filter `commitMode` is ignored inside panel rendering

Recommended primary UI:

- drawer, not popover

Reason:

- mobile-friendly
- better for rich filter controls
- scales better with large filter sets

### `tag-dynamic`

Definition:

- filter is dormant until explicitly inserted through an add-filter flow
- once applied, it appears as an active tag
- clearing removes the tag entirely

Behavior:

- dormant state: available in the picker, not visible in the tag row
- active state: visible as a normal active tag

## State Model

The most important architectural rule:

- there must be one canonical applied filter state

Do not create separate applied state for:

- tag filters
- panel filters
- dynamic filters

### Canonical applied state

This should remain the URL/query-backed source of truth:

```ts
type TableFilterState = {
  search: string
  ui: TableQueryStateFilterRule[]
}
```

### Derived presentation state

Presentation should be derived from:

- filter definitions
- viewport/responsive resolution
- canonical applied state

Suggested runtime shape:

```ts
type ResolvedFilterPresentation = {
  key: string
  kind: TableQueryStateFilterKind
  location: 'tag' | 'panel' | 'tag-dynamic'
  active: boolean
  dormant: boolean
  order: number
  group?: string
}
```

### Panel draft state

Panel filters need one extra transient state layer:

- panel draft state exists only while the panel is open
- it is a local editable copy of canonical state
- applying the panel writes draft changes back to canonical query state
- closing without apply discards the draft unless explicitly preserved

This should be owned by the panel orchestration layer, not by individual filter components.

### Dynamic dormant state

`tag-dynamic` needs explicit dormant/active lifecycle handling:

- inactive + dynamic => dormant
- active + dynamic => rendered tag
- clear => remove rule from canonical state and return to dormant

This state should be derived from canonical rules plus dynamic activation workflow, not stored as a second canonical filter state.

## Responsive Resolution

Location must support responsive values such as:

- `tag`
- `panel`
- `tag-dynamic`
- `panel md:tag`

Rules:

- responsive resolution changes only presentation
- it must never mutate canonical filter values
- an active filter remains active when moving between surfaces

Examples:

- active `panel` filter on mobile becomes active `tag` on desktop
- dormant `tag-dynamic` on desktop may become `panel` on mobile
- same value, same operator, different editing surface

## Recommended Runtime Ownership

### Keep query-state ignorant of rendering

`useQueryState` should continue owning:

- search
- filter rules
- serialization

It should not know:

- whether a filter is in the tag bar
- whether the panel is open
- whether a filter is dormant dynamic

### Add a presentation resolver layer

Create a dedicated composable, for example:

```ts
useTableFilterPresentation({
  schema,
  queryState,
})
```

This composable should own:

- responsive location resolution
- active filter lookup
- dormant dynamic filter lookup
- tag filter list
- panel filter list
- add-filter candidate list
- group/order sorting

### Add a panel controller layer

Create a composable, for example:

```ts
useTableFilterPanel({
  presentation,
  filters,
})
```

This composable should own:

- panel open/close state
- panel draft state
- apply all
- clear all panel filters
- reset draft from canonical state

### Keep type-specific logic separate

Current `useTableFilters` contains both orchestration and type behavior.
That should be split.

Recommended ownership:

- shared orchestration:
  generic filter operations
- kind-specific behavior:
  default values
  operator behavior
  preview behavior
  editor behavior

## Component Refactor Proposal

This is the most important structural part of this proposal.

The current filter UI is organized around tag-mode components:

- `TextFilterTag.vue`
- `OptionFilterTag.vue`
- `BooleanFilterTag.vue`
- `NumberFilterTag.vue`
- `DateFilterTag.vue`

That makes tag mode the architectural center.
This will not scale well once `panel` and `tag-dynamic` become first-class surfaces.

### New component organization

Proposed structure:

```text
components/filters/
  orchestrators/
    FiltersBar.vue
    FiltersPanelDrawer.vue
    DynamicFilterPicker.vue
    ActiveFilterSummaryRow.vue

  shared/
    FilterShell.vue
    FilterLabel.vue
    FilterOperatorSelect.vue
    FilterApplyActions.vue
    FilterTriggerButton.vue
    FilterTagFrame.vue
    FilterEditorPopover.vue
    FilterPanelSection.vue
    FilterEmptyState.vue

  editors/
    text/
      TextFilterEditor.vue
    option/
      OptionFilterEditor.vue
      OptionFilterList.vue
      OptionFilterTree.vue
      OptionFilterRow.vue
    boolean/
      BooleanFilterEditor.vue
    number/
      NumberFilterEditor.vue
      NumberFilterScalarEditor.vue
      NumberFilterRangeEditor.vue
    date/
      DateFilterEditor.vue
      DateFilterScalarEditor.vue
      DateFilterRangeEditor.vue

  surfaces/
    tag/
      FilterTagItem.vue
      FilterTagList.vue
    panel/
      PanelFilterItem.vue
      PanelFilterList.vue
    dynamic/
      DynamicFilterInsertFlow.vue
      DynamicFilterDefinitionPicker.vue

  preview/
    FilterPreviewText.vue
    FilterPreviewTags.vue
    FilterPreviewSummary.vue
```

### Structural rule

Type-specific editor logic should live in `editors/`.

Presentation mode wrappers should live in `surfaces/`.

Shared shell/controls should live in `shared/`.

Top-level orchestration should live in `orchestrators/`.

This prevents:

- duplicating the same operator/actions shell in each mode
- coupling filter type implementation to a single surface

### Example composition

For a text filter shown as a tag:

- `FilterTagItem.vue`
  wraps
- `FilterShell.vue`
  with
- `TextFilterEditor.vue`

For the same filter shown in the panel:

- `PanelFilterItem.vue`
  wraps
- `FilterShell.vue`
  with
- `TextFilterEditor.vue`

For a dynamic insertion flow:

- `DynamicFilterInsertFlow.vue`
  chooses definition/operator/value
  then writes canonical state
  then the active tag renders via normal tag surface

This way:

- filter kind implementation is reusable
- surface behavior stays separate

## Recommended Composable Split

Proposed composables:

### `useTableFilterDefinitions`

Owns:

- normalized definitions
- sort order
- lookup by key

### `useTableFilterState`

Owns:

- canonical filter-state mutations
- add/update/remove/clear helpers
- default values for operators

### `useTableFilterPresentation`

Owns:

- location resolution
- active/dormant presentation state
- grouped filter lists for surfaces

### `useTableFilterPanel`

Owns:

- drawer state
- draft state
- apply/reset/cancel logic

### `useDynamicFilterInsertion`

Owns:

- dynamic picker open state
- filter selection flow
- operator/value staging before insertion

### `useTableFilterOptions`

Keep as the owner of:

- option source querying
- facet counts
- option entry resolution

But make it editor-agnostic rather than tag-specific.

### `useTableFilterPreview`

Owns:

- filter preview text/tag summaries

This should be reusable by:

- tag surface
- panel summaries
- future compact active-filter displays

## Normalized Definition Target

All builder outputs should normalize into one shape:

```ts
type TableFilterDefinitionNormalized = {
  key: string
  kind: 'text' | 'option' | 'boolean' | 'number' | 'date'
  label: TableTextValue
  behavior: ...
  display: ...
  source?: ...
  editor: ...
  preview: ...
}
```

All runtime layers should depend on this normalized shape, not raw builder variants.

## Important Behavioral Rules

### Rule 1

Changing location must never mutate applied state.

### Rule 2

Panel edits are always staged and panel-committed.

### Rule 3

`tag-dynamic` clearing removes the filter from canonical state and returns it to dormant.

### Rule 4

Filter kinds should not know whether they are rendered in tag or panel mode.

### Rule 5

Surface wrappers should not reimplement type-specific editor logic.

## Suggested Implementation Order

1. refactor filter types into the new schema shape:
   - `behavior`
   - `display`
   - `source`
   - `editor`
   - `preview`

2. implement normalized definition resolution

3. split current filter composable responsibilities:
   - definition normalization
   - state mutation
   - presentation resolution
   - panel draft orchestration

4. extract shared filter shell components

5. refactor current tag components into reusable editors + tag wrappers

6. implement panel drawer using the same editors

7. implement `tag-dynamic` insertion flow using the same editors

## Recommended First Practical Slice

The best first practical slice is:

- refactor the filter API and normalization layer
- reorganize components into:
  - `shared/`
  - `editors/`
  - `surfaces/tag/`

Do not start with the panel UI first.

Reason:

- if the editor/shell split is wrong, panel and dynamic workflows will duplicate logic immediately

The first milestone should prove:

- one normalized filter definition shape
- one reusable editor per filter kind
- one tag surface built on top of those editors

Then panel and dynamic modes can be layered on with much less churn.
