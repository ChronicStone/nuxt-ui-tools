<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref } from 'vue'

import { useRangeSelect } from '@nuxt-ui-tools/shared'

import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableBooleanFilterDefinition, TableOptionFilterDefinition } from '../../../types'
import FilterOptionRow from '../shared/FilterOptionRow.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition | TableBooleanFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const isOpen = ref<boolean>(false)
const pendingOperator = ref<string>()

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

const operator = computed(() =>
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
      .find((item: { label: string; value: string }) => item.value === operator.value)?.label ??
    'is', 
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const triggerIcon = computed(() =>
  preview.value.active ? 'i-lucide-circle-x' : 'i-lucide-circle-plus',
)

// Values that were active when the popover was opened — pinned at top
const pinnedValues = ref<Set<string>>(new Set())

let dismissLocked = false

function handleActivate(op: string) {
  pendingOperator.value = op
  dismissLocked = true
  setTimeout(() => {
    isOpen.value = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { dismissLocked = false })
    })
  })
}

function handleOpenChange(open: boolean) {
  if (!open && dismissLocked) return
  isOpen.value = open
  if (open) {
    pinnedValues.value = new Set(
      optionSource.filteredEntries.value
        .filter((e: { selected: boolean }) => e.selected)
        .map((e: { value: string | number | boolean }) => String(e.value)),
    )
  } else {
    pendingOperator.value = undefined
    pinnedRangeSelect.reset()
    restRangeSelect.reset()
  }
}

const sort = computed(() =>
  props.definition.kind === 'option' ? props.definition.sort : undefined,
)

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

const pinnedEntries = computed(() =>
  sortEntries(
    optionSource.filteredEntries.value.filter((e: { value: string | number | boolean }) =>
      pinnedValues.value.has(String(e.value)),
    ),
  ),
)

const restEntries = computed(() =>
  sortEntries(
    optionSource.filteredEntries.value.filter(
      (e: { value: string | number | boolean }) => !pinnedValues.value.has(String(e.value)),
    ),
  ),
)

const hasPinnedSection = computed(() => pinnedEntries.value.length > 0)

function toggleValue(value: string | number | boolean) {
  const operator = pendingOperator.value
  pendingOperator.value = undefined
  internals.filters.toggleOptionFilterValue({ key: props.definition.key, value, operator })
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
      content: 'w-[22rem] rounded-xl p-0 shadow-xl',
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
      @clear="internals.filters.clearFilter({ key: definition.key }); isOpen = false"
    />

    <template #content>
      <div class="overflow-hidden rounded-xl border border-default bg-default">
        <div class="relative border-b border-default">
          <UInput
            v-model="searchQuery"
            size="sm"
            icon="i-lucide-search"
            :placeholder="internals.filters.getFilterLabelText({ label: definition.label })"
            color="neutral"
            variant="ghost"
            class="w-full px-2.5 py-2"
            :loading="optionSource.isStaleLoading.value"
            :ui="{
              base: 'h-8 ps-8',
              leading: 'start-2',
              leadingIcon: 'size-4 text-muted',
              trailing: 'end-2',
            }"
          />
        </div>

        <UScrollArea
          style="max-height: 320px"
          type="hover"
          class="!h-80 p-2"
          :ui="{
            root: 'h-80',
            viewport: 'h-full',
          }"
        >
          <div class="grid gap-0.5">
            <!-- Skeleton rows on initial load -->
            <template v-if="optionSource.isLoading.value">
              <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <USkeleton class="size-4 shrink-0 rounded-md" />
                <USkeleton class="h-3.5 min-w-0 flex-1" />
                <USkeleton class="h-3.5 w-6 shrink-0" />
              </div>
            </template>

            <template v-else>
              <!-- Pinned active options section -->
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

              <!-- Rest of options -->
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

              <div
                v-if="!optionSource.filteredEntries.value.length"
                class="px-3 py-8 text-center text-sm text-muted"
              >
                No matching options.
              </div>
            </template>
          </div>
        </UScrollArea>
      </div>

      <div class="border-t border-default p-2">
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          block
          label="Clear filters"
          @click="internals.filters.clearFilter({ key: definition.key })"
        />
      </div>
    </template>
  </UPopover>
</template>
