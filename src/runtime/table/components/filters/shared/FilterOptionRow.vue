<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import { mergeDataListUiClass, resolveFilterEditorSizeClasses } from '../../../utils'

const props = defineProps<{
  label: string
  count?: number
  countLoading?: boolean
  selected: boolean
  leadingIcon?: string
  selectedIcon?: string
  truncate?: boolean
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const dataListUi = useDataListUi()
const size = computed(
  () => props.size ?? dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value,
)
const ui = computed(() => props.ui ?? dataListUi.ui.value.filterTags?.ui)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        `flex w-full items-center rounded-md text-left transition-colors hover:bg-elevated ${sizeClasses.option} ${selected ? 'bg-elevated text-highlighted' : 'text-default'}`,
        undefined,
        ui?.option,
      )
    "
  >
    <UCheckbox
      :model-value="selected"
      color="neutral"
      :size="size"
      tabindex="-1"
      :icon="selectedIcon"
      :ui="{ base: ui?.optionCheckbox }"
    />

    <UIcon
      v-if="leadingIcon"
      :name="leadingIcon"
      :class="
        mergeDataListUiClass(
          `${sizeClasses.optionIcon} shrink-0 text-muted`,
          undefined,
          ui?.optionIcon,
        )
      "
    />

    <span
      :class="
        mergeDataListUiClass(
          `min-w-0 flex-1 ${sizeClasses.optionLabel} ${(truncate ?? true) ? 'truncate' : ''}`,
          undefined,
          ui?.optionLabel,
        )
      "
      >{{ label }}</span
    >
    <USkeleton v-if="countLoading" class="ml-3 h-3.5 w-6 shrink-0" />
    <span
      v-else-if="count != null"
      :class="mergeDataListUiClass('ml-3 shrink-0 text-muted', undefined, ui?.optionCount)"
      >{{ count }}</span
    >
  </div>
</template>
