<script setup lang="ts">
import { computed } from 'vue'

import type {
  DataListControlSize,
  DataListFilterEditorUi,
  TableFilterOperator,
} from '../../../types'
import {
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveFilterEditorSizeClasses,
} from '../../../utils'

const props = defineProps<{
  title?: string
  items: Array<{ label: string; value: TableFilterOperator }>
  selected?: TableFilterOperator
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const emit = defineEmits<{
  select: [value: TableFilterOperator]
}>()

const sizeClasses = computed(() => resolveFilterEditorSizeClasses(props.size))
const geometry = computed(() => resolveDataListControlGeometry(props.size ?? 'md'))

const operatorHints = {
  contains: 'ilike',
  is: '=',
  isAnyOf: 'in',
  isNot: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  between: '…',
  before: '<',
  after: '>',
} satisfies Record<TableFilterOperator, string>
</script>

<template>
  <div class="p-2">
    <div
      v-if="title"
      :class="[
        'px-2 pb-1.5 pt-1 font-semibold uppercase tracking-[0.08em] text-dimmed',
        geometry.caption,
      ]"
    >
      {{ title }}
    </div>

    <div :class="mergeDataListUiClass('grid gap-0.5', undefined, ui?.list)">
      <button
        v-for="item in items"
        :key="item.value"
        type="button"
        :class="
          mergeDataListUiClass(
            `group flex w-full items-center rounded-md text-left transition-colors hover:bg-elevated/70 ${sizeClasses.option}`,
            undefined,
            ui?.operatorItem,
          )
        "
        @click="emit('select', item.value)"
      >
        <span class="flex w-3 shrink-0 items-center justify-start">
          <span v-if="item.value === selected" class="size-1.5 rounded-full bg-primary" />
        </span>
        <span
          :class="
            mergeDataListUiClass(
              `min-w-0 flex-1 truncate ${sizeClasses.optionLabel}`,
              undefined,
              ui?.operatorLabel,
            )
          "
          :data-selected="item.value === selected"
          class="text-muted group-hover:text-default data-[selected=true]:font-medium data-[selected=true]:text-default"
        >
          {{ item.label }}
        </span>
        <span class="ml-4 shrink-0 font-mono text-dimmed" :class="geometry.caption">
          {{ operatorHints[item.value] }}
        </span>
      </button>
    </div>
  </div>
</template>
