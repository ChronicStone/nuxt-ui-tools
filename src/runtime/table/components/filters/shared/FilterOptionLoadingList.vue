<script setup lang="ts">
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import { mergeDataListUiClass, resolveFilterEditorSizeClasses } from '../../../utils'

const props = withDefaults(
  defineProps<{
    size?: DataListControlSize
    indicator?: 'checkbox' | 'radio'
    ui?: DataListFilterEditorUi
  }>(),
  { indicator: 'radio' },
)

const dataListUi = useDataListUi()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value,
)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(resolvedSize.value))
</script>

<template>
  <div :class="mergeDataListUiClass('grid gap-0.5', undefined, ui?.list)">
    <div
      v-for="index in 5"
      :key="index"
      :class="
        mergeDataListUiClass(
          `flex items-center rounded-md ${sizeClasses.option}`,
          undefined,
          ui?.option,
        )
      "
    >
      <USkeleton
        :class="[
          sizeClasses.optionIcon,
          'shrink-0',
          indicator === 'radio' ? 'rounded-full' : 'rounded-sm',
        ]"
      />
      <USkeleton :class="[sizeClasses.skeletonLine, 'min-w-0 flex-1 rounded-full']" />
      <USkeleton :class="[sizeClasses.skeletonCount, 'shrink-0 rounded-full']" />
    </div>
  </div>
</template>
