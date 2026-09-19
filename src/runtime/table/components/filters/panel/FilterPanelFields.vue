<script setup lang="ts">
import { computed } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { DataListControlSize, DataListFilterPanelUi } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'
import { resolveFilterPanelComponent } from './registry'

const props = defineProps<{ size: DataListControlSize; ui: DataListFilterPanelUi }>()
const internals = useTableInternals()
const sections = computed(() => internals.filterPresentation.panelSections.value)
const captioned = computed(
  () => sections.value.length > 1 || (sections.value[0] && sections.value[0].label !== 'Filters'),
)
</script>

<template>
  <div :class="mergeDataListUiClass('nut-dl-fpanel__fields grid gap-7', undefined, ui.fields)">
    <section
      v-for="section in sections"
      :key="section.label"
      :class="mergeDataListUiClass('nut-dl-fpanel__section grid gap-4', undefined, ui.section)"
    >
      <div
        v-if="captioned"
        :class="
          mergeDataListUiClass(
            'nut-dl-fpanel__caption text-[10.5px] font-semibold tracking-[0.08em] text-dimmed uppercase',
            undefined,
            ui.sectionTitle,
          )
        "
      >
        {{ section.label }}
      </div>
      <component
        :is="resolveFilterPanelComponent(definition)"
        v-for="definition in section.items"
        :key="definition.key"
        :size="props.size"
        :definition="definition"
        :ui="ui"
      />
    </section>
  </div>
</template>
