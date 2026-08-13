<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import { mergeDataListUiClass } from '../../../utils'

defineProps<{
  label: string
  count?: number
  countLoading?: boolean
  selected: boolean
  leadingIcon?: string
  selectedIcon?: string
  truncate?: boolean
}>()

const dataListUi = useDataListUi()
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const ui = computed(() => dataListUi.ui.value.filterTags?.ui)
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        `flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-elevated ${selected ? 'bg-elevated text-highlighted' : 'text-default'}`,
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
      :class="mergeDataListUiClass('size-4 shrink-0 text-muted', undefined, ui?.optionIcon)"
    />

    <span
      :class="
        mergeDataListUiClass(
          `min-w-0 flex-1 ${(truncate ?? true) ? 'truncate' : ''}`,
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
