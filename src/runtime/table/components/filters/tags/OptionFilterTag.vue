<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref } from 'vue'

import { useRangeSelect } from '../../../../shared'
import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableFilterOperator, TableOptionFilterDefinition } from '../../../types'
import FilterOptionRow from '../shared/FilterOptionRow.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const isOpen = ref<boolean>(false)
const pendingOperator = ref<TableFilterOperator>()

const optionSource = useTableFilterOptions({
  definition: props.definition,
  searchQuery,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
})

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
    entries: optionSource.sourceEntries.value,
  }),
)

const operator = computed(
  () =>
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    }),
)

const operatorLabel = computed(
  () =>
    internals.filters
      .getFilterOperatorOptions({
        key: props.definition.key,
      })
      .find((item) => item.value === operator.value)?.label ?? 'is',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const triggerIcon = computed(() =>
  preview.value.active ? 'i-lucide-circle-x' : 'i-lucide-circle-plus',
)

// --- Local selection state (only committed on Apply) ---
const localSelectedValues = ref<(string | number | boolean)[]>([])

// Values that were active when the popover was opened — pinned at top
const pinnedValues = ref<Set<string>>(new Set())

let dismissLocked = false

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  dismissLocked = true
  setTimeout(() => {
    isOpen.value = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dismissLocked = false
      })
    })
  })
}

function initLocalState() {
  const committedRule = internals.filters.getFilterState({ key: props.definition.key })
  const values: (string | number | boolean)[] = Array.isArray(committedRule?.value)
    ? committedRule.value.filter(
        (v: unknown): v is string | number | boolean =>
          typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
      )
    : committedRule?.value != null &&
        (typeof committedRule.value === 'string' ||
          typeof committedRule.value === 'number' ||
          typeof committedRule.value === 'boolean')
      ? [committedRule.value]
      : []

  localSelectedValues.value = values
  pinnedValues.value = new Set(values.map(String))
}

function handleOpenChange(open: boolean) {
  if (!open && dismissLocked) return
  isOpen.value = open
  if (open) {
    initLocalState()
  } else {
    pendingOperator.value = undefined
    searchQuery.value = ''
    pinnedRangeSelect.reset()
    restRangeSelect.reset()
  }
}

const sort = computed(() => props.definition.sort)

function sortEntries<
  T extends { label: string; count?: number; value: string | number | boolean; selected: boolean },
>(entries: T[]): T[] {
  if (!sort.value) return entries
  return [...entries].sort((a, b) => {
    if (sort.value === 'alpha') return a.label.localeCompare(b.label)
    if (sort.value === 'count') return (b.count ?? 0) - (a.count ?? 0)
    return 0
  })
}

// Override `selected` with local state
const displayEntries = computed(() =>
  optionSource.filteredEntries.value.map(
    (entry: {
      label: string
      value: string | number | boolean
      count?: number
      selected: boolean
    }) => ({
      ...entry,
      selected: localSelectedValues.value.some((v) => String(v) === String(entry.value)),
    }),
  ),
)

const pinnedEntries = computed(() =>
  sortEntries(displayEntries.value.filter((e) => pinnedValues.value.has(String(e.value)))),
)

const restEntries = computed(() =>
  sortEntries(displayEntries.value.filter((e) => !pinnedValues.value.has(String(e.value)))),
)

const hasPinnedSection = computed(() => pinnedEntries.value.length > 0)

function toggleValue(value: string | number | boolean) {
  const current = localSelectedValues.value
  const exists = current.some((v) => String(v) === String(value))
  if (exists) {
    localSelectedValues.value = current.filter((v) => String(v) !== String(value))
  } else {
    localSelectedValues.value = [...current, value]
  }
}

function applyFilter() {
  const op = pendingOperator.value
  pendingOperator.value = undefined

  internals.filters.setOptionFilterValues({
    key: props.definition.key,
    values: localSelectedValues.value,
    operator: op,
  })
  isOpen.value = false
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  isOpen.value = false
}

const pinnedRangeSelect = useRangeSelect({
  entries: pinnedEntries,
  onToggle: toggleValue,
})

const restRangeSelect = useRangeSelect({
  entries: restEntries,
  onToggle: toggleValue,
})
</script>

<template>
  <UPopover
    :open="isOpen"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'w-fit overflow-hidden p-0 shadow-none',
    }"
    @update:open="handleOpenChange"
  >
    <TableFilterTrigger
      :label="internals.filters.getFilterLabelText({ label: definition.label })"
      :leading-icon="triggerIcon"
      :operator-label="operatorLabel"
      :operator-items="operatorItems"
      :preview-tags="preview.tags"
      :preview-summary="preview.summary"
      :active="preview.active"
      @select-operator="
        internals.filters.setFilterOperator({ key: definition.key, operator: $event })
      "
      @activate="handleActivate"
      @clear="clearFilter"
    />

    <template #content>
      <div class="w-fit max-w-[calc(100vw-1rem)] bg-default">
        <div class="relative border-b border-default p-2">
          <UInput
            v-model="searchQuery"
            size="sm"
            icon="i-lucide-search"
            :placeholder="internals.filters.getFilterLabelText({ label: definition.label })"
            color="neutral"
            variant="ghost"
            class="w-[min(14rem,calc(100vw-3rem))] max-w-full"
            :loading="optionSource.isStaleLoading.value"
            :ui="{ base: 'rounded-sm' }"
          />
        </div>

        <UScrollArea
          style="max-height: 320px"
          type="hover"
          class="max-h-80 p-2"
          :ui="{
            root: 'max-h-80',
            viewport: 'max-h-80',
          }"
        >
          <div class="grid gap-0.5">
            <template v-if="optionSource.isLoading.value">
              <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-sm px-3 py-2">
                <USkeleton class="size-4 shrink-0 rounded-md" />
                <USkeleton class="h-3.5 min-w-0 flex-1" />
                <USkeleton class="h-3.5 w-6 shrink-0" />
              </div>
            </template>

            <template v-else>
              <template v-if="hasPinnedSection">
                <button
                  v-for="(entry, i) in pinnedEntries"
                  :key="String(entry.value)"
                  type="button"
                  class="block w-full"
                  @click="pinnedRangeSelect.handleClick($event, entry, i)"
                >
                  <FilterOptionRow
                    :label="entry.label"
                    :count="entry.count"
                    :selected="entry.selected"
                  />
                </button>

                <div class="my-1 border-t border-default" />
              </template>

              <button
                v-for="(entry, i) in restEntries"
                :key="String(entry.value)"
                type="button"
                class="block w-full"
                @click="restRangeSelect.handleClick($event, entry, i)"
              >
                <FilterOptionRow
                  :label="entry.label"
                  :count="entry.count"
                  :selected="entry.selected"
                />
              </button>

              <div v-if="!displayEntries.length" class="px-3 py-8 text-center text-sm text-muted">
                No matching options.
              </div>
            </template>
          </div>
        </UScrollArea>

        <div class="flex items-center justify-between border-t border-default p-2">
          <UButton color="neutral" variant="ghost" size="sm" label="Clear" @click="clearFilter" />
          <UButton color="neutral" variant="subtle" size="sm" label="Apply" @click="applyFilter" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
