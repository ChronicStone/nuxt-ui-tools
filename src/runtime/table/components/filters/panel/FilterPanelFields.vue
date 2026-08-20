<script setup lang="ts">
import { computed } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { DataListControlSize, DataListFilterPanelUi } from '../../../types'
import { mergeDataListUiClass, resolveDataListControlGeometry } from '../../../utils'
import { resolveFilterPanelComponent } from './registry'

const props = defineProps<{ size: DataListControlSize; ui: DataListFilterPanelUi }>()
const internals = useTableInternals()
const geometry = computed(() => resolveDataListControlGeometry(props.size))
</script>

<template>
  <div :class="mergeDataListUiClass(`grid ${geometry.fieldGap}`, undefined, ui.fields)">
    <component
      :is="resolveFilterPanelComponent(definition)"
      v-for="definition in internals.filterPresentation.panelDefinitions.value"
      :key="definition.key"
      :size="size"
      :definition="definition"
    />
  </div>
</template>
