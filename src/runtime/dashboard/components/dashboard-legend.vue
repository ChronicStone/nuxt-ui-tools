<script setup lang="ts">
import { computed } from 'vue'

import { useDashboardUi } from '../composables/use-dashboard-ui'
import type { DashboardLegendItem, DashboardLegendUi } from '../types'
import { resolveDashboardClasses } from '../utils/ui'

const props = defineProps<{ items: readonly DashboardLegendItem[]; ui?: DashboardLegendUi }>()

const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      item: 'inline-flex items-center gap-1.5 whitespace-nowrap',
      root: 'flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted',
      swatch: 'shrink-0',
    },
    appUi.value.legend,
    props.ui,
  ),
)
</script>

<template>
  <ul :class="classes.root">
    <li v-for="item in items" :key="item.key" :class="classes.item">
      <span
        aria-hidden="true"
        :class="[
          classes.swatch,
          item.dashed ? 'h-0 w-3 border-t-2 border-dashed' : 'size-[9px] rounded-[3px]',
        ]"
        :style="item.dashed ? { borderColor: item.color } : { background: item.color }"
      />
      {{ item.label }}
    </li>
  </ul>
</template>
