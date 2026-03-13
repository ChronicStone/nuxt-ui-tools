<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'
import { computed, ref } from 'vue'

import { useTableFilterOptions } from '../../composables/use-table-filter-options'
import { useTableInternals } from '../../composables/use-table-internals'
import type { TableBooleanFilterDefinition, TableOptionFilterDefinition } from '../../types'
import FilterOptionRow from './FilterOptionRow.vue'
import TableFilterTrigger from './TableFilterTrigger.vue'

type FilterOptionEntry = {
  label: string | (() => unknown)
  value: string | number | boolean
}

const props = defineProps<{
  definition: TableOptionFilterDefinition | TableBooleanFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref('')
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

function toggleValue(options: { value: string | number | boolean }) {
  internals.filters.toggleOptionFilterValue({
    key: props.definition.key,
    value: options.value,
  })
}
</script>

<template>
  <UPopover
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'w-[22rem] rounded-xl p-0 shadow-xl',
    }"
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
      @clear="internals.filters.clearFilter({ key: definition.key })"
    />

    <template #content>
      <div class="overflow-hidden rounded-xl border border-default bg-default">
        <UInput
          v-model="searchQuery"
          size="sm"
          icon="i-lucide-search"
          :placeholder="internals.filters.getFilterLabelText({ label: definition.label })"
          color="neutral"
          variant="ghost"
          class="w-full border-b border-default px-2.5 py-2"
          :ui="{
            base: 'h-8 ps-8',
            leading: 'start-2',
            leadingIcon: 'size-4 text-muted',
          }"
        />

        <UScrollArea
          style="max-height: 320px"
          type="hover"
          class="!h-80 p-2"
          :ui="{
            root: 'h-80',
            viewport: 'h-full',
          }"
        >
          <div class="grid gap-1.5">
            <div
              v-if="optionSource.isLoading.value"
              class="px-3 py-8 text-center text-sm text-muted"
            >
              Loading options...
            </div>

            <button
              v-for="entry in optionSource.filteredEntries.value"
              :key="String(entry.value)"
              type="button"
              class="block w-full"
              @click="toggleValue({ value: entry.value })"
            >
              <FilterOptionRow
                :label="entry.label"
                :count="entry.count"
                :selected="entry.selected"
              />
            </button>

            <div
              v-if="!optionSource.isLoading.value && !optionSource.filteredEntries.value.length"
              class="px-3 py-8 text-center text-sm text-muted"
            >
              No matching options.
            </div>
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
