<script setup lang="ts">
import {
  useTable,
  type ExtractTableFilterKey,
  type ExtractTableFilterRule,
  type ExtractTableFilterValue,
  type TableFilterOperator,
  type TableUiFilterDefinition,
} from '@nuxt-ui-tools/table'

const { classes } = usePlaygroundAppearance()
const route = useRoute()
const table = useTable(tableSchema)



const EMPTY_SELECT_VALUE = '__empty__'
const EMPTY_BOOLEAN_VALUE = '__any__'

type PlaygroundFilterKey = ExtractTableFilterKey<typeof tableSchema>
type PlaygroundFilterRule = ExtractTableFilterRule<typeof tableSchema, PlaygroundFilterKey>
type PlaygroundFilterValue = ExtractTableFilterValue<typeof tableSchema, PlaygroundFilterKey>

const pendingFilterKey = ref<PlaygroundFilterKey | ''>('')
const draftFilterKeys = ref<PlaygroundFilterKey[]>([])
const draftOperators = ref<Partial<Record<PlaygroundFilterKey, TableFilterOperator>>>({})

const layoutOptions = [
  { label: 'Table', value: 'table' },
  { label: 'Grid', value: 'grid' },
]

const booleanFilterOptions = [
  { label: 'Any', value: EMPTY_BOOLEAN_VALUE },
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
]

const fallbackOptionItems: Record<string, Array<{ label: string; value: string }>> = {
  'organisation.status': [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
}


const sortKeyOptions = computed(() => [
  { label: 'Default', value: EMPTY_SELECT_VALUE },
  ...table.api.sortKeys.value.map((key) => ({ label: key, value: key })),
])

const sortDirectionOptions = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
]

const pageSizeOptions = computed(() =>
  table.api.pageSizeOptions.value.map((size) => ({
    label: String(size),
    value: size,
  })),
)

const displayedFilterKeys = computed(() => {
  const activeKeys = table.queryState.value.filters.ui.map((filter) => filter.key)
  return [...new Set([...draftFilterKeys.value, ...activeKeys])]
})

const availableFilterOptions = computed(() =>
  table.api.uiFilters.value
    .filter((filter) => !displayedFilterKeys.value.includes(filter.key))
    .map((filter) => ({
      label: resolveLabel(filter.label),
      value: filter.key,
    })),
)

const filterBlocks = computed(() =>
  displayedFilterKeys.value
    .map((key) => getFilterDefinition(key))
    .filter((filter): filter is TableUiFilterDefinition => !!filter),
)

const activeFilterCount = computed(() => table.queryState.value.filters.ui.length)
const schemaSummaryPreview = computed(() => JSON.stringify(tablePlaygroundSummary, null, 2))
const queryStatePreview = computed(() => JSON.stringify(table.queryState.value, null, 2))
const resolvedFilterStatePreview = computed(() => JSON.stringify(table.resolvedFilterState.value, null, 2))
const routeQueryPreview = computed(() =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(route.query).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(String) : String(value ?? ''),
      ]),
    ),
    null,
    2,
  ),
)
const urlPreview = computed(() => {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(route.query)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, String(entry))
      }
      continue
    }

    if (value != null) {
      params.set(key, String(value))
    }
  }

  const queryString = params.toString()
  return queryString ? `?${decodeURIComponent(queryString)}` : '(no query params)'
})

function resolveLabel(label: string | (() => unknown)) {
  return typeof label === 'function' ? String(label()) : label
}

function getFilterDefinition(key: PlaygroundFilterKey) {
  return table.api.getFilterDefinition(key)
}

function getFilterState(key: PlaygroundFilterKey) {
  return table.api.getFilterState(key)
}

function getFilterOperators(key: PlaygroundFilterKey) {
  return table.api.getFilterOperators(key)
}

function addFilter(
  key: PlaygroundFilterKey,
  value: PlaygroundFilterValue,
  options?: { operator?: TableFilterOperator },
) {
  table.api.addFilter(key, value, options)
}

function updateFilter(
  key: PlaygroundFilterKey,
  patch: Partial<PlaygroundFilterRule>,
) {
  table.api.updateFilter(key, patch)
}

function removeFilter(key: PlaygroundFilterKey) {
  table.api.removeFilter(key)
}

function getFilterOperator(key: PlaygroundFilterKey) {
  return (
    getFilterState(key)?.operator ??
    draftOperators.value[key] ??
    getFilterOperators(key)[0] ??
    'is'
  )
}

function getFilterOperatorOptions(key: PlaygroundFilterKey) {
  return getFilterOperators(key).map((operator) => ({
      label: formatOperatorLabel(operator),
      value: operator,
  }))
}

function getOptionItems(filter: TableUiFilterDefinition) {
  if (filter.kind !== 'option') {
    return []
  }

  if (Array.isArray(filter.options)) {
    return filter.options.map((option) => ({
      label: resolveLabel(option.label),
      value: String(option.value),
    }))
  }

  return fallbackOptionItems[filter.key] ?? []
}

function addSelectedFilter() {
  if (!pendingFilterKey.value) {
    return
  }

  if (!draftFilterKeys.value.includes(pendingFilterKey.value)) {
    draftFilterKeys.value = [...draftFilterKeys.value, pendingFilterKey.value]
  }

  draftOperators.value = {
    ...draftOperators.value,
    [pendingFilterKey.value]:
      getFilterOperators(pendingFilterKey.value)[0] ?? 'is',
  }

  pendingFilterKey.value = ''
}

function removeFilterBlock(key: PlaygroundFilterKey) {
  draftFilterKeys.value = draftFilterKeys.value.filter((draftKey) => draftKey !== key)

  const nextDraftOperators = { ...draftOperators.value }
  delete nextDraftOperators[key]
  draftOperators.value = nextDraftOperators

  removeFilter(key)
}

function updateFilterOperator(key: PlaygroundFilterKey, value: string | number | undefined) {
  if (!value) {
    return
  }

  const operator = value as TableFilterOperator
  const currentFilter = getFilterState(key)
  const definition = getFilterDefinition(key)

  draftOperators.value = {
    ...draftOperators.value,
    [key]: operator,
  }

  if (!currentFilter || !definition) {
    return
  }

  if (definition.kind === 'number') {
    updateFilter(key, {
      operator,
      value:
        operator === 'between' ? normalizeNumberRange(currentFilter.value) : normalizeSingleNumber(currentFilter.value),
    })
    return
  }

  if (definition.kind === 'date') {
    updateFilter(key, {
      operator,
      value:
        operator === 'between' ? normalizeDateRange(currentFilter.value) : normalizeSingleDate(currentFilter.value),
    })
    return
  }

  updateFilter(key, {
    operator,
  })
}

function updateTextFilter(key: PlaygroundFilterKey, value: string | number | undefined) {
  const nextValue = String(value ?? '')

  if (!nextValue) {
    removeFilter(key)
    return
  }

  addFilter(key, nextValue, {
    operator: getFilterOperator(key),
  })
}

function updateOptionFilter(key: PlaygroundFilterKey, value: string[] | string | undefined) {
  const nextValue = Array.isArray(value) ? value : value ? [String(value)] : []

  if (!nextValue.length) {
    removeFilter(key)
    return
  }

  addFilter(key, nextValue, {
    operator: getFilterOperator(key),
  })
}

function updateBooleanFilter(key: PlaygroundFilterKey, value: string | number | undefined) {
  if (!value || value === EMPTY_BOOLEAN_VALUE) {
    removeFilter(key)
    return
  }

  addFilter(key, value === 'true', {
    operator: getFilterOperator(key),
  })
}

function updateNumberFilter(key: PlaygroundFilterKey, value: string | number | undefined) {
  if (value === '' || value == null) {
    removeFilter(key)
    return
  }

  addFilter(key, Number(value), {
    operator: getFilterOperator(key),
  })
}

function updateNumberRangeValue(
  key: PlaygroundFilterKey,
  bound: 'from' | 'to',
  value: string | number | undefined,
) {
  const currentRange = normalizeNumberRange(getFilterState(key)?.value)
  const nextRange = {
    ...currentRange,
    [bound]: value === '' || value == null ? undefined : Number(value),
  }

  if (nextRange.from == null && nextRange.to == null) {
    removeFilter(key)
    return
  }

  addFilter(key, nextRange, {
    operator: 'between',
  })
}

function updateDateFilter(key: PlaygroundFilterKey, value: string | number | undefined) {
  if (!value) {
    removeFilter(key)
    return
  }

  addFilter(key, new Date(`${value}T00:00:00.000Z`), {
    operator: getFilterOperator(key),
  })
}

function updateDateRangeValue(
  key: PlaygroundFilterKey,
  bound: 'from' | 'to',
  value: string | number | undefined,
) {
  const currentRange = normalizeDateRange(getFilterState(key)?.value)
  const nextRange = {
    ...currentRange,
    [bound]: value ? new Date(`${value}T00:00:00.000Z`) : undefined,
  }

  if (!nextRange.from && !nextRange.to) {
    removeFilter(key)
    return
  }

  addFilter(key, nextRange, {
    operator: 'between',
  })
}

function normalizeNumberRange(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return {
    from:
      typeof (value as { from?: unknown }).from === 'number'
        ? (value as { from?: number }).from
        : undefined,
    to:
      typeof (value as { to?: unknown }).to === 'number'
        ? (value as { to?: number }).to
        : undefined,
  }
}

function normalizeSingleNumber(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  return normalizeNumberRange(value).from ?? 0
}

function normalizeDateRange(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return {
    from:
      (value as { from?: unknown }).from instanceof Date
        ? (value as { from?: Date }).from
        : undefined,
    to: (value as { to?: unknown }).to instanceof Date ? (value as { to?: Date }).to : undefined,
  }
}

function normalizeSingleDate(value: unknown) {
  if (value instanceof Date) {
    return value
  }

  return normalizeDateRange(value).from ?? new Date()
}

function formatDateValue(value: unknown) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : ''
}

function getTextValue(key: PlaygroundFilterKey) {
  const value = getFilterState(key)?.value
  return typeof value === 'string' ? value : ''
}

function getOptionValue(key: PlaygroundFilterKey) {
  const value = getFilterState(key)?.value
  return Array.isArray(value) ? (value as unknown[]).map(String) : []
}

function getBooleanValue(key: PlaygroundFilterKey) {
  const value = getFilterState(key)?.value
  return typeof value === 'boolean' ? String(value) : ''
}

function getNumberValue(key: PlaygroundFilterKey) {
  const value = getFilterState(key)?.value
  return typeof value === 'number' ? String(value) : ''
}

function getNumberRangeValue(key: PlaygroundFilterKey, bound: 'from' | 'to') {
  const value = normalizeNumberRange(getFilterState(key)?.value)[bound]
  return value == null ? '' : String(value)
}

function getDateValue(key: PlaygroundFilterKey) {
  return formatDateValue(getFilterState(key)?.value)
}

function getDateRangeValue(key: PlaygroundFilterKey, bound: 'from' | 'to') {
  return formatDateValue(normalizeDateRange(getFilterState(key)?.value)[bound])
}

function formatOperatorLabel(operator: TableFilterOperator) {
  const labels: Record<TableFilterOperator, string> = {
    contains: 'Contains',
    is: 'Is',
    isAnyOf: 'Is any of',
    isNot: 'Is not',
    gt: 'Greater than',
    gte: 'At least',
    lt: 'Lower than',
    lte: 'At most',
    between: 'Between',
    before: 'Before',
    after: 'After',
  }

  return labels[operator]
}
</script>

<template>
  <section :class="classes.pageStack">
    <div class="grid gap-4">
      <article :class="classes.panel">
        <div class="grid gap-6">
          <section
            class="grid gap-5 rounded-[28px] border border-default bg-default/85 p-5 shadow-sm sm:p-6"
          >
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="max-w-3xl">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge color="neutral" variant="soft" label="Table API lab" />
                  <UBadge color="neutral" variant="subtle">
                    {{ table.queryState.value.layout }}
                  </UBadge>
                </div>

                <h1 class="mt-3 text-2xl font-semibold text-highlighted">Query State Lab</h1>
                <p class="mt-2 max-w-2xl text-sm text-muted">
                  Exercise layout, pagination, sorting, filters, and serialization through
                  <code>table.api</code> in a quieter workspace built for repeated debugging.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UPopover :content="{ align: 'end', sideOffset: 8 }" arrow>
                  <UButton color="neutral" variant="ghost" size="md" icon="i-lucide-file-json-2">
                    Schema
                  </UButton>

                  <template #content>
                    <div class="w-[420px] max-w-[calc(100vw-2rem)] p-4">
                      <p class="text-sm font-medium">Schema summary</p>
                      <pre
                        class="mt-3 max-h-80 overflow-auto rounded-xl border border-default bg-muted/10 p-3 text-xs leading-6"
                        >{{ schemaSummaryPreview }}</pre
                      >
                    </div>
                  </template>
                </UPopover>

                <UButton color="neutral" variant="soft" size="md" @click="table.api.clearFilters()">
                  Clear filters
                </UButton>
                <UButton
                  color="neutral"
                  variant="solid"
                  size="md"
                  @click="table.api.resetQueryState()"
                >
                  Reset state
                </UButton>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-2xl border border-default bg-muted/10 p-4">
                <p class="text-[11px] font-medium uppercase text-muted">Active layout</p>
                <p class="mt-2 text-lg font-semibold text-highlighted">
                  {{ table.queryState.value.layout }}
                </p>
              </div>

              <div class="rounded-2xl border border-default bg-muted/10 p-4">
                <p class="text-[11px] font-medium uppercase text-muted">Visible filters</p>
                <p class="mt-2 text-lg font-semibold text-highlighted">
                  {{ activeFilterCount }}
                </p>
              </div>

              <div class="rounded-2xl border border-default bg-muted/10 p-4">
                <p class="text-[11px] font-medium uppercase text-muted">Sort key</p>
                <p class="mt-2 truncate text-lg font-semibold text-highlighted">
                  {{ table.queryState.value.sorting?.sortKey ?? 'default' }}
                </p>
              </div>

              <div class="rounded-2xl border border-default bg-muted/10 p-4">
                <p class="text-[11px] font-medium uppercase text-muted">Page window</p>
                <p class="mt-2 text-lg font-semibold text-highlighted">
                  {{ table.queryState.value.pagination.pageIndex }} /
                  {{ table.queryState.value.pagination.pageSize }}
                </p>
              </div>
            </div>
          </section>

          <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div
              class="grid gap-4 rounded-[28px] border border-default bg-default/85 p-5 shadow-sm sm:p-6"
            >
              <div>
                <h2 class="text-base font-semibold text-highlighted">Base controls</h2>
                <p class="mt-1 text-sm text-muted">
                  Core query-state inputs kept compact so you can iterate without losing context.
                </p>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="grid gap-2 min-w-0">
                  <label class="text-xs font-medium uppercase text-muted">Layout</label>
                  <USelectMenu
                    :model-value="table.queryState.value.layout"
                    :items="layoutOptions"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    value-key="value"
                    label-key="label"
                    :search-input="false"
                    class="w-full"
                    @update:model-value="table.api.setLayout(($event as 'table' | 'grid') ?? 'table')"
                  />
                </div>

                <div class="grid gap-2 min-w-0 md:col-span-2">
                  <label class="text-xs font-medium uppercase text-muted">Search</label>
                  <UInput
                    :model-value="table.queryState.value.filters.search"
                    placeholder="Search name or email"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    icon="i-lucide-search"
                    class="w-full"
                    @update:model-value="table.api.setSearch(String($event ?? ''))"
                  />
                </div>

                <div class="grid gap-2 min-w-0">
                  <label class="text-xs font-medium uppercase text-muted">Page</label>
                  <UInput
                    :model-value="String(table.queryState.value.pagination.pageIndex)"
                    type="number"
                    min="1"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    class="w-full"
                    @update:model-value="table.api.setPage(Number($event) || 1)"
                  />
                </div>

                <div class="grid gap-2 min-w-0">
                  <label class="text-xs font-medium uppercase text-muted">Page size</label>
                  <USelectMenu
                    :model-value="table.queryState.value.pagination.pageSize"
                    :items="pageSizeOptions"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    value-key="value"
                    label-key="label"
                    :search-input="false"
                    class="w-full"
                    @update:model-value="table.api.setPageSize(Number($event) || 1)"
                  />
                </div>

                <div class="grid gap-2 min-w-0">
                  <label class="text-xs font-medium uppercase text-muted">Sort key</label>
                  <USelectMenu
                    :model-value="table.queryState.value.sorting?.sortKey ?? EMPTY_SELECT_VALUE"
                    :items="sortKeyOptions"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    value-key="value"
                    label-key="label"
                    :search-input="false"
                    class="w-full"
                    @update:model-value="
                      !$event || $event === EMPTY_SELECT_VALUE
                        ? table.api.setSortKey(undefined)
                        : table.api.setSortKey(String($event))
                    "
                  />
                </div>

                <div class="grid gap-2 min-w-0">
                  <label class="text-xs font-medium uppercase text-muted">Sort direction</label>
                  <USelectMenu
                    :model-value="table.queryState.value.sorting?.sortDirection ?? 'asc'"
                    :items="sortDirectionOptions"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    value-key="value"
                    label-key="label"
                    :search-input="false"
                    class="w-full"
                    @update:model-value="table.api.setSortDirection(($event as 'asc' | 'desc') ?? 'asc')"
                  />
                </div>
              </div>
            </div>

            <div
              class="grid gap-4 rounded-[28px] border border-default bg-default/85 p-5 shadow-sm sm:p-6"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 class="text-base font-semibold text-highlighted">Filters</h2>
                  <p class="mt-1 text-sm text-muted">
                    Add filter blocks, tweak operators, and watch route serialization update live.
                  </p>
                </div>

                <UBadge color="neutral" variant="soft">
                  {{ filterBlocks.length }} block{{ filterBlocks.length === 1 ? '' : 's' }}
                </UBadge>
              </div>

              <div
                class="grid gap-3 rounded-2xl border border-dashed border-default bg-muted/10 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div class="grid gap-2 min-w-0">
                  <label class="text-xs font-medium uppercase text-muted">Add filter</label>
                  <USelectMenu
                    v-model="pendingFilterKey"
                    :items="availableFilterOptions"
                    color="neutral"
                    variant="subtle"
                    size="lg"
                    value-key="value"
                    label-key="label"
                    :search-input="false"
                    placeholder="Choose a filter"
                    class="w-full"
                  />
                </div>

                <div class="flex items-end">
                  <UButton
                    icon="i-lucide-plus"
                    size="md"
                    class="w-full justify-center md:w-auto"
                    @click="addSelectedFilter"
                  >
                    Add filter
                  </UButton>
                </div>
              </div>
            </div>
          </section>

          <section
            class="grid gap-4 rounded-[28px] border border-default bg-default/85 p-5 shadow-sm sm:p-6"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 class="text-base font-semibold text-highlighted">Filter blocks</h2>
                <p class="mt-1 text-sm text-muted">
                  Each block maps directly to the underlying UI filter definition and operator
                  state.
                </p>
              </div>
            </div>

            <div
              v-if="!filterBlocks.length"
              class="rounded-2xl border border-dashed border-default bg-muted/10 p-8 text-sm text-muted"
            >
              Add a filter to start testing block composition and serialized output.
            </div>

            <div v-else class="grid gap-4">
              <div
                v-for="filter in filterBlocks"
                :key="filter.key"
                class="grid gap-4 rounded-2xl border border-default bg-muted/10 p-4 sm:p-5"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-medium text-highlighted">{{ resolveLabel(filter.label) }}</p>
                    <p class="mt-1 text-xs text-muted">{{ filter.key }}</p>
                  </div>

                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-trash-2"
                    @click="removeFilterBlock(filter.key)"
                  />
                </div>

                <div class="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div class="grid gap-2 min-w-0">
                    <label class="text-xs font-medium uppercase text-muted">Operator</label>
                    <USelectMenu
                      :model-value="getFilterOperator(filter.key)"
                      :items="getFilterOperatorOptions(filter.key)"
                      color="neutral"
                      variant="subtle"
                      size="lg"
                      value-key="value"
                      label-key="label"
                      :search-input="false"
                      class="w-full"
                      @update:model-value="
                        updateFilterOperator(filter.key, $event as string | number | undefined)
                      "
                    />
                  </div>

                  <div class="grid gap-2 min-w-0">
                    <label class="text-xs font-medium uppercase text-muted">Value</label>

                    <UInput
                      v-if="filter.kind === 'text'"
                      :model-value="getTextValue(filter.key)"
                      placeholder="Enter a value"
                      color="neutral"
                      variant="subtle"
                      size="lg"
                      class="w-full"
                      @update:model-value="updateTextFilter(filter.key, $event)"
                    />

                    <USelectMenu
                      v-else-if="filter.kind === 'option'"
                      :model-value="getOptionValue(filter.key)"
                      :items="getOptionItems(filter)"
                      color="neutral"
                      variant="subtle"
                      size="lg"
                      value-key="value"
                      label-key="label"
                      multiple
                      class="w-full"
                      @update:model-value="updateOptionFilter(filter.key, $event)"
                    />

                    <USelectMenu
                      v-else-if="filter.kind === 'boolean'"
                      :model-value="getBooleanValue(filter.key)"
                      :items="booleanFilterOptions"
                      color="neutral"
                      variant="subtle"
                      size="lg"
                      value-key="value"
                      label-key="label"
                      :search-input="false"
                      class="w-full"
                      @update:model-value="updateBooleanFilter(filter.key, $event)"
                    />

                    <div
                      v-else-if="
                        filter.kind === 'number' && getFilterOperator(filter.key) === 'between'
                      "
                      class="grid gap-2 sm:grid-cols-2"
                    >
                      <UInput
                        :model-value="getNumberRangeValue(filter.key, 'from')"
                        type="number"
                        placeholder="Min"
                        color="neutral"
                        variant="subtle"
                        size="lg"
                        class="w-full"
                        @update:model-value="updateNumberRangeValue(filter.key, 'from', $event)"
                      />
                      <UInput
                        :model-value="getNumberRangeValue(filter.key, 'to')"
                        type="number"
                        placeholder="Max"
                        color="neutral"
                        variant="subtle"
                        size="lg"
                        class="w-full"
                        @update:model-value="updateNumberRangeValue(filter.key, 'to', $event)"
                      />
                    </div>

                    <UInput
                      v-else-if="filter.kind === 'number'"
                      :model-value="getNumberValue(filter.key)"
                      type="number"
                      placeholder="Value"
                      color="neutral"
                      variant="subtle"
                      size="lg"
                      class="w-full"
                      @update:model-value="updateNumberFilter(filter.key, $event)"
                    />

                    <div
                      v-else-if="
                        filter.kind === 'date' && getFilterOperator(filter.key) === 'between'
                      "
                      class="grid gap-2 sm:grid-cols-2"
                    >
                      <UInput
                        :model-value="getDateRangeValue(filter.key, 'from')"
                        type="date"
                        color="neutral"
                        variant="subtle"
                        size="lg"
                        class="w-full"
                        @update:model-value="updateDateRangeValue(filter.key, 'from', $event)"
                      />
                      <UInput
                        :model-value="getDateRangeValue(filter.key, 'to')"
                        type="date"
                        color="neutral"
                        variant="subtle"
                        size="lg"
                        class="w-full"
                        @update:model-value="updateDateRangeValue(filter.key, 'to', $event)"
                      />
                    </div>

                    <UInput
                      v-else-if="filter.kind === 'date'"
                      :model-value="getDateValue(filter.key)"
                      type="date"
                      color="neutral"
                      variant="subtle"
                      size="lg"
                      class="w-full"
                      @update:model-value="updateDateFilter(filter.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </article>

      <section
        class="grid gap-4 rounded-[32px] border border-default/70 bg-default/90 p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="text-base font-semibold text-highlighted">Debug surface</h2>
            <p class="mt-1 text-sm text-muted">
              Full-width inspection for route params, normalized query state, and the current schema
              contract.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UBadge color="neutral" variant="soft" label="useRoute()" />
            <UBadge color="neutral" variant="subtle" label="Full width" />
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-2">
          <div class="grid gap-2 rounded-2xl border border-default bg-muted/10 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-medium text-highlighted">Computed query state</p>
              <UBadge color="neutral" variant="soft" label="Query-safe" />
            </div>
            <pre
              class="max-h-[34rem] overflow-auto rounded-xl border border-default bg-default/80 p-4 text-xs leading-6"
              >{{ queryStatePreview }}</pre
            >
          </div>

          <div class="grid gap-2 rounded-2xl border border-default bg-muted/10 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-medium text-highlighted">Resolved filter state</p>
              <UBadge color="neutral" variant="soft" label="Engine-ready" />
            </div>
            <pre
              class="max-h-[34rem] overflow-auto rounded-xl border border-default bg-default/80 p-4 text-xs leading-6"
              >{{ resolvedFilterStatePreview }}</pre
            >
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <div class="grid gap-2 rounded-2xl border border-default bg-muted/10 p-4">
            <p class="text-sm font-medium text-highlighted">Route query</p>
            <pre
              class="min-h-32 overflow-auto rounded-xl border border-default bg-default/80 p-3 text-xs leading-6"
              >{{ urlPreview }}</pre
            >
          </div>

          <div class="grid gap-2 rounded-2xl border border-default bg-muted/10 p-4">
            <p class="text-sm font-medium text-highlighted">Parsed params</p>
            <pre
              class="min-h-32 overflow-auto rounded-xl border border-default bg-default/80 p-3 text-xs leading-6"
              >{{ routeQueryPreview }}</pre
            >
          </div>

          <div class="grid gap-2 rounded-2xl border border-default bg-muted/10 p-4">
            <p class="text-sm font-medium text-highlighted">Schema contract</p>
            <pre
              class="min-h-32 overflow-auto rounded-xl border border-default bg-default/80 p-3 text-xs leading-6"
              >{{ schemaSummaryPreview }}</pre
            >
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
