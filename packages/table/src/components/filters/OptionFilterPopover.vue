<script setup lang="ts">
import { computed, ref } from 'vue'

import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'

import type {
  TableBooleanFilterDefinition,
  TableOptionFilterDefinition,
} from '../../types'
import FilterOptionRow from './FilterOptionRow.vue'
import TableFilterTrigger from './TableFilterTrigger.vue'
import { useTableInternals } from '../../composables/use-table-internals'

type FilterOptionEntry = {
  label: string | (() => unknown)
  value: string | number | boolean
}

const props = defineProps<{
  definition: TableOptionFilterDefinition | TableBooleanFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref('')

const resolvedOptions = computed(() => {
  if (props.definition.kind === 'boolean') {
    return []
  }

  if (Array.isArray(props.definition.options)) {
    return props.definition.options.map((entry: { label: string | (() => unknown); value: string | number | boolean }) => ({
      label: internals.filters.getFilterLabelText({
        label: entry.label,
      }),
      value: entry.value,
    }))
  }

  return []
})

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
    entries: resolvedOptions.value,
  }),
)

const operator = computed(() =>
  internals.filters.getFilterOperator({
    key: props.definition.key,
  }),
)

const operatorLabel = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }).find((item: { label: string; value: string }) => item.value === operator.value)?.label ?? 'is',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const optionEntries = computed(() =>
  internals.filters.getFilterOptionEntries({
    key: props.definition.key,
    entries: resolvedOptions.value,
  }),
)

const filteredEntries = computed(() => {
  const normalizedSearch = searchQuery.value.trim().toLowerCase()

  if (!normalizedSearch.length) {
    return optionEntries.value
  }

  return optionEntries.value.filter((entry) =>
    entry.label.toLowerCase().includes(normalizedSearch),
  )
})

const triggerIcon = computed(() =>
  preview.value.active ? 'i-lucide-circle-x' : 'i-lucide-circle-plus',
)

function toggleValue(options: {
  value: string | number | boolean
}) {
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
      content: 'w-[22rem] rounded-xl p-0 shadow-xl'
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
      @select-operator="internals.filters.setFilterOperator({ key: definition.key, operator: $event })"
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

        <div class="grid max-h-80 gap-1.5 overflow-y-auto p-2">
          <button
            v-for="entry in filteredEntries"
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
      </div>
    </template>
  </UPopover>
</template>
