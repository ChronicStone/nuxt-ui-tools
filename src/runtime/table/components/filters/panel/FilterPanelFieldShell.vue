<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListControlSize } from '../../../types'
import { resolveDataListControlGeometry } from '../../../utils'

const props = defineProps<{
  label: string
  active?: boolean
  size?: DataListControlSize
}>()

defineSlots<{
  actions?: () => any
  default?: () => any
}>()

const dataListUi = useDataListUi()
const resolvedSize = computed(() => props.size ?? dataListUi.controlSize.value)
const geometry = computed(() => resolveDataListControlGeometry(resolvedSize.value))
</script>

<template>
  <section :class="['grid', geometry.toolbarGap]">
    <div :class="['flex min-w-0 items-center justify-between', geometry.toolbarGap]">
      <h3 :class="['min-w-0 flex-1 truncate font-medium text-highlighted', geometry.text]">
        {{ label }}
      </h3>

      <div v-if="$slots.actions" :class="['flex shrink-0 items-center', geometry.toolbarGap]">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </section>
</template>
