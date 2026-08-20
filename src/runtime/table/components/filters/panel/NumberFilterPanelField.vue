<script setup lang="ts">
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import { computed, ref } from 'vue'

import { isDate, isNumber, isObject } from '../../../../shared/utils/predicate'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  DataListControlSize,
  TableFilterOperator,
  TableNumberFilterDefinition,
  TableNumberFilterOperator,
} from '../../../types'
import { resolveDataListControlGeometry, resolveNumberFilterUi } from '../../../utils'
import FilterMatchModeButton from '../shared/FilterMatchModeButton.vue'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'

const props = defineProps<{
  definition: TableNumberFilterDefinition
  size: DataListControlSize
}>()

const internals = useTableInternals()
const geometry = computed(() => resolveDataListControlGeometry(props.size))
const pendingOperator = ref<TableNumberFilterOperator>(resolveInitialOperator())

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const filterUi = computed(() => resolveNumberFilterUi(props.definition, pendingOperator.value))
const isActive = computed(
  () =>
    internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)

const scalarValue = computed<number | undefined>({
  get() {
    const value = internals.filterPresentation.getPanelDraftFilterState({
      key: props.definition.key,
    })?.value
    return isNumber(value) ? value : undefined
  },
  set(value) {
    internals.filterPresentation.setPanelScalarFilterValue({
      key: props.definition.key,
      value,
      operator: pendingOperator.value,
    })
  },
})

const rangeValue = computed({
  get: () => {
    const value = internals.filterPresentation.getPanelDraftFilterState({
      key: props.definition.key,
    })?.value
    if (!isObject(value) || isDate(value)) return { from: undefined, to: undefined }

    return {
      from: 'from' in value && isNumber(value.from) ? value.from : undefined,
      to: 'to' in value && isNumber(value.to) ? value.to : undefined,
    }
  },
  set(value: { from?: number; to?: number }) {
    internals.filterPresentation.setPanelScalarFilterValue({
      key: props.definition.key,
      value:
        value.from == null && value.to == null
          ? undefined
          : Object.fromEntries(
              [
                value.from == null ? undefined : ['from', value.from],
                value.to == null ? undefined : ['to', value.to],
              ].filter((entry): entry is [string, number] => entry !== undefined),
            ),
      operator: pendingOperator.value,
    })
  },
})

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({
    key: props.definition.key,
  })
  return operator === 'isNot' ||
    operator === 'gt' ||
    operator === 'gte' ||
    operator === 'lt' ||
    operator === 'lte' ||
    operator === 'between'
    ? operator
    : 'is'
}

function handleOperatorChange(operator: TableFilterOperator) {
  pendingOperator.value =
    operator === 'isNot' ||
    operator === 'gt' ||
    operator === 'gte' ||
    operator === 'lt' ||
    operator === 'lte' ||
    operator === 'between'
      ? operator
      : 'is'

  if (filterUi.value.clearOnOperatorChange)
    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
}

function updateRangeFrom(value: number | undefined) {
  rangeValue.value = {
    ...rangeValue.value,
    from: value,
  }
}

function updateRangeTo(value: number | undefined) {
  rangeValue.value = {
    ...rangeValue.value,
    to: value,
  }
}

function resolveIncrementConfig(hideStepper: boolean) {
  return hideStepper ? false : { variant: 'ghost' as const }
}
</script>

<template>
  <FilterPanelFieldShell
    :label="internals.filters.getFilterLabelText({ label: definition.label })"
    :active="isActive"
    :size="size"
  >
    <template #actions>
      <FilterMatchModeButton
        v-if="operatorItems.length"
        :label="operatorItems.find((item) => item.value === pendingOperator)?.label ?? 'is'"
        :items="operatorItems"
        :selected="pendingOperator"
        :size="size"
        variant="compact"
        @select="handleOperatorChange"
      />
    </template>

    <div v-if="pendingOperator === 'between'" :class="['grid', geometry.toolbarGap]">
      <div :class="['grid grid-cols-2', geometry.toolbarGap]">
        <UInputNumber
          :model-value="rangeValue.from"
          :placeholder="filterUi.range.inputs.fromPlaceholder"
          :min="filterUi.min"
          :max="filterUi.max"
          :step="filterUi.step"
          :format-options="filterUi.formatOptions"
          :disable-wheel-change="filterUi.range.inputs.disableWheelChange"
          :increment="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
          :decrement="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
          :size="size"
          class="w-full"
          @update:model-value="updateRangeFrom"
        />

        <UInputNumber
          :model-value="rangeValue.to"
          :placeholder="filterUi.range.inputs.toPlaceholder"
          :min="filterUi.min"
          :max="filterUi.max"
          :step="filterUi.step"
          :format-options="filterUi.formatOptions"
          :disable-wheel-change="filterUi.range.inputs.disableWheelChange"
          :increment="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
          :decrement="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
          :size="size"
          class="w-full"
          @update:model-value="updateRangeTo"
        />
      </div>
    </div>

    <div v-else>
      <UInputNumber
        :model-value="scalarValue"
        :placeholder="filterUi.scalar.input.placeholder"
        :min="filterUi.min"
        :max="filterUi.max"
        :step="filterUi.step"
        :format-options="filterUi.formatOptions"
        :disable-wheel-change="filterUi.scalar.input.disableWheelChange"
        :increment="resolveIncrementConfig(filterUi.scalar.input.hideStepper)"
        :decrement="resolveIncrementConfig(filterUi.scalar.input.hideStepper)"
        :size="size"
        class="w-full"
        @update:model-value="scalarValue = $event"
      />
    </div>
  </FilterPanelFieldShell>
</template>
