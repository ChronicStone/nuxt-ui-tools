<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import type {
  DataListControlSize,
  DataListFilterEditorUi,
  TableFilterOperator,
} from '../../../types'
import { mergeDataListUiClass, resolveFilterEditorSizeClasses } from '../../../utils'

const props = defineProps<{
  items: Array<{ label: string; value: TableFilterOperator }>
  selected?: TableFilterOperator
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const emit = defineEmits<{
  select: [value: TableFilterOperator]
}>()

const sizeClasses = resolveFilterEditorSizeClasses(props.size)
</script>

<template>
  <div :class="mergeDataListUiClass(sizeClasses.scrollArea, undefined, ui?.list)">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      :class="
        mergeDataListUiClass(
          `flex w-full items-center rounded-md text-left transition-colors hover:bg-elevated/70 ${sizeClasses.option}`,
          undefined,
          ui?.operatorItem,
        )
      "
      @click="emit('select', item.value)"
    >
      <span
        :class="
          mergeDataListUiClass(
            `min-w-0 flex-1 truncate text-default ${sizeClasses.optionLabel}`,
            undefined,
            ui?.operatorLabel,
          )
        "
      >
        {{ item.label }}
      </span>
      <UIcon
        v-if="item.value === selected"
        name="i-lucide-check"
        :class="`${sizeClasses.optionIcon} shrink-0 text-muted`"
      />
    </button>
  </div>
</template>
