<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListFilterPanelUi } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'

export interface FilterPanelChipEntry {
  value: string | number | boolean
  label: string
  count?: number
  selected: boolean
  color?: string
  icon?: string
}

const props = defineProps<{
  entries: FilterPanelChipEntry[]
  loading?: boolean
  countLoading?: boolean
  showCounts?: boolean
  ui?: DataListFilterPanelUi
}>()
const emit = defineEmits<{ toggle: [value: string | number | boolean] }>()
const dataListUi = useDataListUi()
const ui = computed<DataListFilterPanelUi>(() => ({
  ...dataListUi.ui.value.filterPanel?.ui,
  ...props.ui,
}))
const CHIP =
  'nut-dl-chip inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-transparent bg-muted px-2.5 text-[12.5px] text-default transition-colors outline-none hover:bg-elevated focus-visible:ring-2 focus-visible:ring-primary/40'
const CHIP_ACTIVE =
  'nut-dl-chip--active border-primary/25 bg-primary/10 text-[var(--nut-dl-accent-ink,var(--ui-primary))] hover:bg-primary/15'
</script>

<template>
  <div
    :class="mergeDataListUiClass('nut-dl-chips flex flex-wrap gap-1.5', undefined, ui.chips)"
    role="group"
  >
    <template v-if="loading">
      <span
        v-for="index in 3"
        :key="index"
        class="nut-dl-skeleton nut-dl-chip__skeleton inline-block h-7 rounded-md"
        :style="{ width: `${52 + index * 14}px` }"
        aria-hidden="true"
      />
    </template>
    <button
      v-for="entry in entries"
      v-else
      :key="String(entry.value)"
      type="button"
      :class="
        mergeDataListUiClass(
          CHIP,
          entry.selected ? mergeDataListUiClass(CHIP_ACTIVE, undefined, ui.chipActive) : undefined,
          ui.chip,
        )
      "
      :aria-pressed="entry.selected"
      :data-value="String(entry.value)"
      @click="emit('toggle', entry.value)"
    >
      <span
        v-if="entry.color"
        class="nut-dl-chip__dot size-[7px] shrink-0 rounded-full"
        :style="{ background: entry.color }"
        aria-hidden="true"
      />
      <UIcon v-else-if="entry.icon" :name="entry.icon" class="size-3.5 shrink-0 text-muted" />
      <span class="nut-dl-chip__label min-w-0 truncate">{{ entry.label }}</span>
      <span
        v-if="showCounts && countLoading"
        class="nut-dl-skeleton inline-block h-2.5 w-4 rounded"
        aria-hidden="true"
      />
      <small v-else-if="showCounts" class="nut-dl-chip__count text-[11px] text-dimmed tabular-nums">
        {{ entry.count ?? 0 }}
      </small>
    </button>
  </div>
</template>
