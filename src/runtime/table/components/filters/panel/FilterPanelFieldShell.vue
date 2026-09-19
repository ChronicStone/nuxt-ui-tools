<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListControlSize, DataListFilterPanelUi } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'

const props = defineProps<{
  label: string
  meta?: string
  active?: boolean
  size?: DataListControlSize
  ui?: DataListFilterPanelUi
}>()

defineSlots<{
  actions?: () => any
  default?: () => any
}>()

const dataListUi = useDataListUi()
const ui = computed<DataListFilterPanelUi>(() => ({ ...dataListUi.ui.value.filterPanel?.ui, ...props.ui }))
</script>

<template>
  <section
    :class="mergeDataListUiClass('nut-dl-fpanel__field grid gap-2', undefined, ui.field)"
    :data-active="active"
  >
    <div class="flex min-w-0 items-center justify-between gap-2">
      <h3 :class="mergeDataListUiClass('nut-dl-fpanel__label min-w-0 flex-1 truncate text-[12px] font-semibold text-default', undefined, ui.fieldLabel)">
        {{ label }}
      </h3>
      <div class="flex shrink-0 items-center gap-2">
        <small
          v-if="meta"
          :class="mergeDataListUiClass('nut-dl-fpanel__meta text-[11px] font-medium text-dimmed tabular-nums', undefined, ui.fieldMeta)"
        >
          {{ meta }}
        </small>
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </section>
</template>
