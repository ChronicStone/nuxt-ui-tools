<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref } from 'vue'

import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableResolvedFilterOptionEntry,
} from '../../../types'
import { flattenVisibleFilterOptionTree, resolveOptionFilterUi } from '../../../utils'
import FilterMatchModeButton from '../shared/FilterMatchModeButton.vue'
import FilterOptionRow from '../shared/FilterOptionRow.vue'
import FilterPanelInputTrigger from './FilterPanelInputTrigger.vue'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const expandedIds = ref<Set<string>>(new Set())
const pendingOperator = ref<TableOptionFilterOperator>(resolveInitialOperator())
const isOpen = ref<boolean>(false)

const optionSource = useTableFilterOptions({
  definition: props.definition,
  searchQuery,
  active: internals.filterPresentation.panelOpen,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
})

const filterUi = computed(() => resolveOptionFilterUi(props.definition, pendingOperator.value))
const isActive = computed(() =>
  internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)
const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const selectedValues = computed(() => {
  const value = internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key })?.value
  if (Array.isArray(value)) return value.filter(isPrimitiveValue)
  return isPrimitiveValue(value) ? [value] : []
})

const displayEntries = computed(() =>
  optionSource.filteredEntries.value.map((entry) => ({
    ...entry,
    icon: entry.icon,
    selected:
      entry.value != null &&
      selectedValues.value.some((value) => String(value) === String(entry.value)),
  })),
)

const displayTreeEntries = computed(() =>
  mapSelectedTreeEntries({
    entries: optionSource.filteredTreeEntries.value,
    selectedValues: selectedValues.value,
  }),
)

const effectiveExpandedIds = computed(
  () => new Set([...optionSource.searchExpandedIds.value, ...expandedIds.value]),
)

const visibleTreeEntries = computed(() =>
  flattenVisibleFilterOptionTree({
    entries: displayTreeEntries.value,
    expandedIds: effectiveExpandedIds.value,
    selectable: filterUi.value.tree.selectable,
  }),
)

const flatRadioItems = computed(() =>
  displayEntries.value.map((entry) => ({
    label: entry.label,
    value: String(entry.value),
    count: filterUi.value.row.showCounts ? entry.count : undefined,
    icon: resolveRowIcon(entry),
    truncate: filterUi.value.row.truncate,
  })),
)

const flatRadioValue = computed({
  get: () => selectedValues.value[0] != null ? String(selectedValues.value[0]) : undefined,
  set: (value: string | undefined) => {
    if (value == null) return
    const match = displayEntries.value.find(entry => String(entry.value) === value)
    if (!match) return
    setSelectedValues([match.value])
  },
})

const triggerSummary = computed(() => {
  if (!selectedValues.value.length) return ''

  const labels = optionSource.sourceEntries.value
    .filter(entry => entry.value != null && selectedValues.value.some(value => String(value) === String(entry.value)))
    .map(entry => entry.label)

  if (!labels.length) return `${selectedValues.value.length} selected`
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return labels.join(', ')
  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`
})

const treeRadioItems = computed(() =>
  visibleTreeEntries.value.map((entry) => ({
    id: entry.id,
    label: entry.label,
    value: entry.id,
    count: filterUi.value.row.showCounts ? entry.count : undefined,
    icon: entry.icon,
    truncate: filterUi.value.row.truncate,
    depth: entry.depth,
    expandable: entry.expandable,
    expanded: effectiveExpandedIds.value.has(entry.id),
    selectable: entry.selectable,
    disabled: !entry.selectable,
  })),
)

const treeRadioValue = computed({
  get: () => {
    const selected = selectedValues.value[0]
    if (selected == null) return undefined

    return visibleTreeEntries.value.find(
      (entry) => entry.value != null && String(entry.value) === String(selected),
    )?.id
  },
  set: (value: string | undefined) => {
    if (value == null) return
    const match = visibleTreeEntries.value.find(entry => entry.id === value)
    if (!match || !match.selectable || match.value == null) return
    setSelectedValues([match.value])
  },
})

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({ key: props.definition.key })
  return operator === 'is' || operator === 'isNot' ? operator : 'isAnyOf'
}

function handleOperatorChange(operator: TableFilterOperator) {
  pendingOperator.value = operator === 'is' || operator === 'isNot' ? operator : 'isAnyOf'

  if (filterUi.value.clearOnOperatorChange) {
    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
    return
  }

  if (!selectedValues.value.length) return

  internals.filterPresentation.setPanelOptionFilterValues({
    key: props.definition.key,
    values: selectedValues.value,
    operator: pendingOperator.value,
  })
}

function toggleValue(value: string | number | boolean) {
  const exists = selectedValues.value.some((entry) => String(entry) === String(value))

  if (filterUi.value.selection.mode === 'single') {
    if (exists) {
      if (!filterUi.value.selection.allowEmpty) return
      internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
      return
    }

    setSelectedValues([value])
    return
  }

  if (exists) {
    if (!filterUi.value.selection.allowEmpty && selectedValues.value.length === 1) return
    setSelectedValues(selectedValues.value.filter((entry) => String(entry) !== String(value)))
    return
  }

  if (
    filterUi.value.selection.max != null &&
    selectedValues.value.length >= filterUi.value.selection.max
  ) return

  setSelectedValues([...selectedValues.value, value])
}

function setSelectedValues(values: Array<string | number | boolean>) {
  internals.filterPresentation.setPanelOptionFilterValues({
    key: props.definition.key,
    values,
    operator: pendingOperator.value,
  })
}

function toggleTreeEntry(entry: {
  value?: string | number | boolean
  selectable: boolean
  expandable: boolean
  id: string
}) {
  if (!entry.selectable) {
    if (entry.expandable) toggleExpanded(entry.id)
    return
  }

  if (entry.value == null) return
  toggleValue(entry.value)
}

function toggleExpanded(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function getTreeIndentStyle(depth: number) {
  return {
    paddingInlineStart: `${depth * 10}px`,
  }
}

function resolveRowIcon(entry: { label: string; value?: string | number | boolean; count?: number; icon?: string }) {
  if (entry.value == null) return entry.icon

  return filterUi.value.row.getIcon?.({
    label: entry.label,
    value: entry.value,
    count: entry.count,
    ...(entry.icon ? { icon: entry.icon } : {}),
  }) ?? entry.icon
}

function mapSelectedTreeEntries(options: {
  entries: TableResolvedFilterOptionEntry[]
  selectedValues: (string | number | boolean)[]
}): TableResolvedFilterOptionEntry[] {
  return options.entries.map((entry) => ({
    ...entry,
    selected:
      entry.value != null &&
      options.selectedValues.some((value) => String(value) === String(entry.value)),
    children: mapSelectedTreeEntries({
      entries: entry.children,
      selectedValues: options.selectedValues,
    }),
  }))
}

function isPrimitiveValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <FilterPanelFieldShell
    :label="internals.filters.getFilterLabelText({ label: definition.label })"
    :active="isActive"
  >
    <template #actions>
      <FilterMatchModeButton
        v-if="operatorItems.length > 1"
        :label="operatorItems.find((item) => item.value === pendingOperator)?.label ?? 'is any of'"
        :items="operatorItems"
        variant="compact"
        @select="handleOperatorChange"
      />
    </template>

    <UPopover
      v-model:open="isOpen"
      mode="click"
      :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
      :ui="{ content: 'w-[var(--reka-popover-trigger-width)] max-w-[var(--reka-popover-trigger-width)] overflow-hidden p-0 shadow-none' }"
    >
      <FilterPanelInputTrigger
        :value="triggerSummary"
        :placeholder="filterUi.labels.searchPlaceholder"
      />

      <template #content>
        <div class="bg-default">
          <div v-if="filterUi.searchable" class="w-full border-b border-default p-2">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              :placeholder="filterUi.labels.searchPlaceholder"
              class="w-full"
              :loading="optionSource.isStaleLoading.value"
              variant="ghost"
            />
          </div>
          <UScrollArea
            style="max-height: 320px"
            type="hover"
            class="max-h-80 p-2"
            :ui="{ root: 'max-h-80', viewport: 'max-h-80' }"
          >
            <template v-if="filterUi.presentation === 'tree'">
              <template v-if="optionSource.isLoading.value">
                <div class="grid gap-0.5">
                  <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-md px-3 py-2">
                    <USkeleton class="size-4 shrink-0 rounded-full" />
                    <USkeleton class="h-3.5 min-w-0 flex-1" />
                    <USkeleton class="h-3.5 w-6 shrink-0" />
                  </div>
                </div>
              </template>

              <div v-else-if="filterUi.selection.mode === 'multiple'" class="grid gap-0.5">
                <button
                  v-for="entry in visibleTreeEntries"
                  :key="entry.id"
                  type="button"
                  class="block w-full"
                  @click="toggleTreeEntry(entry)"
                >
                  <div
                    class="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-elevated"
                    :class="entry.selected ? 'bg-elevated text-highlighted' : 'text-default'"
                  >
                    <div class="flex min-w-0 flex-1 items-center gap-3" :style="getTreeIndentStyle(entry.depth)">
                      <button
                        v-if="entry.expandable"
                        type="button"
                        class="flex size-4 shrink-0 items-center justify-center text-muted transition-transform"
                        :class="effectiveExpandedIds.has(entry.id) ? 'rotate-90' : ''"
                        @click.stop="toggleExpanded(entry.id)"
                      >
                        <UIcon name="i-lucide-chevron-right" class="size-4" />
                      </button>
                      <span v-else class="size-4 shrink-0" />

                      <UCheckbox
                        v-if="entry.selectable"
                        :model-value="entry.selected"
                        color="neutral"
                        size="md"
                        tabindex="-1"
                        :icon="filterUi.row.selectedIcon"
                        :ui="{ base: '!rounded-md', indicator: '!rounded-none' }"
                      />
                      <span v-else class="size-5 shrink-0" />

                      <UIcon
                        v-if="entry.icon"
                        :name="entry.icon"
                        class="size-4 shrink-0 text-muted"
                      />

                      <span class="min-w-0 flex-1" :class="filterUi.row.truncate ? 'truncate' : ''">
                        {{ entry.label }}
                      </span>
                    </div>

                    <USkeleton
                      v-if="filterUi.row.showCounts && optionSource.isCountLoading.value"
                      class="ml-3 h-3.5 w-6 shrink-0"
                    />
                    <span v-else-if="filterUi.row.showCounts && entry.count != null" class="ml-3 shrink-0 text-muted">
                      {{ entry.count }}
                    </span>
                  </div>
                </button>
              </div>

              <URadioGroup
                v-else-if="treeRadioItems.length"
                v-model="treeRadioValue"
                :items="treeRadioItems"
                color="neutral"
                variant="list"
                :ui="{
                  root: 'w-full',
                  fieldset: 'grid gap-0.5',
                  item: 'flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated',
                  container: 'self-center pl-3',
                  base: 'cursor-pointer',
                  wrapper: 'min-w-0 flex-1 py-2 pr-3',
                  label: 'w-full cursor-pointer text-sm text-default',
                }"
              >
                <template #label="{ item }">
                  <div class="flex min-w-0 items-center gap-3" :style="getTreeIndentStyle(item.depth)">
                    <button
                      v-if="item.expandable"
                      type="button"
                      class="flex size-4 shrink-0 items-center justify-center text-muted transition-transform"
                      :class="item.expanded ? 'rotate-90' : ''"
                      @click.stop="toggleExpanded(item.id)"
                    >
                      <UIcon name="i-lucide-chevron-right" class="size-4" />
                    </button>
                    <span v-else class="size-4 shrink-0" />

                    <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0 text-muted" />
                    <span class="min-w-0 flex-1" :class="item.truncate ? 'truncate' : ''">
                      {{ item.label }}
                    </span>
                    <USkeleton v-if="optionSource.isCountLoading.value" class="ml-3 h-3.5 w-6 shrink-0" />
                    <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
                      {{ item.count }}
                    </span>
                  </div>
                </template>
              </URadioGroup>
            </template>

            <template v-else>
              <div v-if="filterUi.selection.mode === 'multiple'" class="grid gap-0.5">
                <button
                  v-for="entry in displayEntries"
                  :key="entry.value == null ? entry.label : String(entry.value)"
                  type="button"
                  class="block w-full"
                  @click="entry.value != null && toggleValue(entry.value)"
                >
                  <FilterOptionRow
                    :label="entry.label"
                    :count="filterUi.row.showCounts ? entry.count : undefined"
                    :count-loading="optionSource.isCountLoading.value"
                    :selected="entry.selected"
                    :leading-icon="resolveRowIcon(entry)"
                    :selected-icon="filterUi.row.selectedIcon"
                    :truncate="filterUi.row.truncate"
                  />
                </button>
              </div>

              <URadioGroup
                v-else-if="flatRadioItems.length"
                v-model="flatRadioValue"
                :items="flatRadioItems"
                color="neutral"
                variant="list"
                :ui="{
                  root: 'w-full',
                  fieldset: 'grid gap-0.5',
                  item: 'flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated',
                  container: 'self-center pl-3',
                  base: 'cursor-pointer',
                  wrapper: 'min-w-0 flex-1 py-2 pr-3',
                  label: 'w-full cursor-pointer text-sm text-default',
                }"
              >
                <template #label="{ item }">
                  <div class="flex min-w-0 items-center gap-3">
                    <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0 text-muted" />
                    <span class="min-w-0 flex-1" :class="item.truncate ? 'truncate' : ''">
                      {{ item.label }}
                    </span>
                    <USkeleton v-if="optionSource.isCountLoading.value" class="ml-3 h-3.5 w-6 shrink-0" />
                    <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
                      {{ item.count }}
                    </span>
                  </div>
                </template>
              </URadioGroup>
            </template>

            <div
              v-if="!optionSource.isLoading.value && !displayEntries.length && !visibleTreeEntries.length"
              class="px-3 py-8 text-center text-sm text-muted"
            >
              {{ filterUi.labels.empty }}
            </div>
          </UScrollArea>
        </div>
      </template>
    </UPopover>
  </FilterPanelFieldShell>
</template>
