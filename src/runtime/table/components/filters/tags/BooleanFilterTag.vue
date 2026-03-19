<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableBooleanFilterDefinition } from '../../../types'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableBooleanFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const isOpen = ref<boolean>(false)

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

const triggerIcon = computed(() =>
  preview.value.active ? 'i-lucide-circle-x' : 'i-lucide-circle-plus',
)

// --- Local selection state (only committed on Apply) ---
const localValue = ref<boolean | null>(null)

function initLocalState() {
  const committedRule = internals.filters.getFilterState({ key: props.definition.key })

  if (committedRule?.value === true || committedRule?.value === false) {
    localValue.value = committedRule.value
  } else {
    localValue.value = null
  }
}

function handleOpenChange(open: boolean) {
  isOpen.value = open
  if (open) {
    initLocalState()
  }
}

function selectValue(value: boolean) {
  localValue.value = localValue.value === value ? null : value
}

function applyFilter() {
  if (localValue.value === null) {
    internals.filters.clearFilter({ key: props.definition.key })
  } else {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: localValue.value,
    })
  }
  isOpen.value = false
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  isOpen.value = false
}

const entries = computed(() => {
  const source = optionSource.filteredEntries.value as Array<{
    label: string
    value: boolean
    count?: number
    selected: boolean
  }>

  return source.map((entry) => ({
    ...entry,
    selected: localValue.value === entry.value,
  }))
})
</script>

<template>
  <UPopover
    :open="isOpen"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'w-fit p-0 shadow-none',
    }"
    @update:open="handleOpenChange"
  >
    <TableFilterTrigger
      :label="internals.filters.getFilterLabelText({ label: definition.label })"
      :leading-icon="triggerIcon"
      operator-label="is"
      :operator-items="[]"
      :preview-tags="preview.tags"
      :preview-summary="preview.summary"
      :active="preview.active"
      @clear="clearFilter"
    />

    <template #content>
      <div
        class="min-w-[14rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-sm border border-default bg-default"
      >
        <div class="grid gap-0.5 p-2">
          <button
            v-for="entry in entries"
            :key="String(entry.value)"
            type="button"
            class="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-elevated"
            :class="entry.selected ? 'bg-elevated text-highlighted' : 'text-default'"
            @click="selectValue(entry.value)"
          >
            <span
              class="flex size-4 shrink-0 items-center justify-center rounded-sm border"
              :class="entry.selected ? 'border-inverted bg-inverted' : 'border-default'"
            >
              <UIcon
                v-if="entry.selected"
                name="i-lucide-check"
                class="size-3 text-[var(--ui-bg)]"
              />
            </span>
            <span class="min-w-0 flex-1 truncate">{{ entry.label }}</span>
            <span v-if="entry.count != null" class="shrink-0 text-muted">{{ entry.count }}</span>
          </button>
        </div>

        <div class="flex items-center justify-between border-t border-default p-2">
          <UButton color="neutral" variant="ghost" size="sm" label="Clear" @click="clearFilter" />
          <UButton color="neutral" variant="subtle" size="sm" label="Apply" @click="applyFilter" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
