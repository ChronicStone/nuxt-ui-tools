<script setup lang="ts">
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import { computed, ref } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableFilterOperator, TableNumberFilterDefinition, TableNumberFilterOperator } from '../../../types'
import { resolveNumberFilterUi } from '../../../utils'
import FilterMatchModeButton from '../shared/FilterMatchModeButton.vue'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'

const props = defineProps<{
  definition: TableNumberFilterDefinition
}>()

const internals = useTableInternals()
const pendingOperator = ref<TableNumberFilterOperator>(resolveInitialOperator())

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const filterUi = computed(() => resolveNumberFilterUi(props.definition, pendingOperator.value))
const isActive = computed(() =>
  internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)

const scalarValue = computed<number | undefined>({
  get() {
    const value = internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key })?.value
    return typeof value === 'number' ? value : undefined
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
    const value = internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key })?.value
    if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Date)
      return { from: undefined, to: undefined }

    return {
      from: typeof value.from === 'number' ? value.from : undefined,
      to: typeof value.to === 'number' ? value.to : undefined,
    }
  },
  set(value: { from?: number; to?: number }) {
    internals.filterPresentation.setPanelScalarFilterValue({
      key: props.definition.key,
      value: value.from == null && value.to == null
        ? undefined
        : {
            ...(value.from == null ? {} : { from: value.from }),
            ...(value.to == null ? {} : { to: value.to }),
          },
      operator: pendingOperator.value,
    })
  },
})

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({ key: props.definition.key })
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
  pendingOperator.value = operator === 'isNot' ||
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
  >
    <template #actions>
      <FilterMatchModeButton
        v-if="operatorItems.length > 1"
        :label="operatorItems.find((item) => item.value === pendingOperator)?.label ?? 'is'"
        :items="operatorItems"
        variant="compact"
        @select="handleOperatorChange"
      />
    </template>

    <div v-if="pendingOperator === 'between'" class="grid gap-3">
      <div class="grid grid-cols-2 gap-2">
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
        class="w-full"
        @update:model-value="scalarValue = $event"
      />
    </div>
  </FilterPanelFieldShell>
</template>
