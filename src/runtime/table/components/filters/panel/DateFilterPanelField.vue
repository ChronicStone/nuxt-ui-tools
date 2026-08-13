<script setup lang="ts">
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import UInputDate from '@nuxt/ui/components/InputDate.vue'
import { computed, ref, shallowRef, watch } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableDateFilterDefinition,
  TableDateFilterOperator,
  TableFilterOperator,
} from '../../../types'
import { getDateRangeValue, resolveDateFilterUi } from '../../../utils'
import FilterMatchModeButton from '../shared/FilterMatchModeButton.vue'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'

const props = defineProps<{
  definition: TableDateFilterDefinition
}>()

const internals = useTableInternals()
const pendingOperator = ref<TableDateFilterOperator>(resolveInitialOperator())

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const filterUi = computed(() => resolveDateFilterUi(props.definition, pendingOperator.value))
const isActive = computed(
  () =>
    internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)
const localDate = shallowRef<CalendarDate | undefined>(undefined)
const localRangeStart = shallowRef<CalendarDate | undefined>(undefined)
const localRangeEnd = shallowRef<CalendarDate | undefined>(undefined)

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({
    key: props.definition.key,
  })
  return operator === 'isNot' ||
    operator === 'before' ||
    operator === 'after' ||
    operator === 'between'
    ? operator
    : 'is'
}

function handleOperatorChange(operator: TableFilterOperator) {
  pendingOperator.value =
    operator === 'isNot' || operator === 'before' || operator === 'after' || operator === 'between'
      ? operator
      : 'is'

  if (filterUi.value.clearOnOperatorChange) clearFilter()
}

function setSingleDate(value: unknown) {
  localDate.value = coerceCalendarDate(value)
  syncScalarDraft()
}

function setRangeStart(value: unknown) {
  localRangeStart.value = coerceCalendarDate(value)
  syncRangeDraft()
}

function setRangeEnd(value: unknown) {
  localRangeEnd.value = coerceCalendarDate(value)
  syncRangeDraft()
}

function syncScalarDraft() {
  internals.filterPresentation.setPanelScalarFilterValue({
    key: props.definition.key,
    value: localDate.value ? toJsDate(localDate.value) : undefined,
    operator: pendingOperator.value,
  })
}

function syncRangeDraft() {
  const from = localRangeStart.value ? toJsDate(localRangeStart.value) : undefined
  const to = localRangeEnd.value ? toJsDate(localRangeEnd.value) : undefined

  internals.filterPresentation.setPanelScalarFilterValue({
    key: props.definition.key,
    value: from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : undefined,
    operator: pendingOperator.value,
  })
}

function resetLocalState() {
  if (pendingOperator.value === 'between') {
    const range = getDateRangeValue({
      value: internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key })
        ?.value,
    })

    localRangeStart.value = range?.from ? toCalendarDate(range.from) : undefined
    localRangeEnd.value = range?.to ? toCalendarDate(range.to) : undefined
    localDate.value = undefined
    return
  }

  const value = internals.filterPresentation.getPanelDraftFilterState({
    key: props.definition.key,
  })?.value
  const date = value instanceof Date ? value : value ? new Date(String(value)) : undefined
  localDate.value = date ? toCalendarDate(date) : undefined
  localRangeStart.value = undefined
  localRangeEnd.value = undefined
}

function clearFilter() {
  internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
  localDate.value = undefined
  localRangeStart.value = undefined
  localRangeEnd.value = undefined
}

function coerceCalendarDate(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'year' in value &&
    'month' in value &&
    'day' in value &&
    typeof value.year === 'number' &&
    typeof value.month === 'number' &&
    typeof value.day === 'number'
  ) {
    return new CalendarDate(value.year, value.month, value.day)
  }

  return undefined
}

function toCalendarDate(value: unknown) {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number')
    return undefined

  const resolvedDate = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(resolvedDate.getTime())) return undefined

  return new CalendarDate(
    resolvedDate.getFullYear(),
    resolvedDate.getMonth() + 1,
    resolvedDate.getDate(),
  )
}

function toJsDate(value: CalendarDate) {
  return value.toDate(getLocalTimeZone())
}

resetLocalState()

watch(
  () => internals.filterPresentation.panelOpen.value,
  (open) => {
    if (!open) return
    resetLocalState()
  },
)

watch(
  () => internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key })?.value,
  () => {
    resetLocalState()
  },
  { deep: true },
)

watch(
  () => pendingOperator.value,
  () => {
    resetLocalState()
  },
)
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

    <div v-if="pendingOperator === 'between'" class="grid gap-2 sm:grid-cols-2">
      <UInputDate
        :model-value="localRangeStart"
        leading
        :fixed="filterUi.range.input.fixed"
        :highlight="filterUi.range.input.highlight"
        :granularity="filterUi.range.input.granularity"
        :hide-time-zone="filterUi.range.input.hideTimeZone"
        :hour-cycle="filterUi.range.input.hourCycle"
        leading-icon="i-lucide-calendar-days"
        class="w-full"
        @update:model-value="setRangeStart"
      />

      <UInputDate
        :model-value="localRangeEnd"
        leading
        :fixed="filterUi.range.input.fixed"
        :highlight="filterUi.range.input.highlight"
        :granularity="filterUi.range.input.granularity"
        :hide-time-zone="filterUi.range.input.hideTimeZone"
        :hour-cycle="filterUi.range.input.hourCycle"
        leading-icon="i-lucide-calendar-days"
        class="w-full"
        @update:model-value="setRangeEnd"
      />
    </div>

    <UInputDate
      v-else
      :model-value="localDate"
      leading
      :fixed="filterUi.scalar.input.fixed"
      :highlight="filterUi.scalar.input.highlight"
      :granularity="filterUi.scalar.input.granularity"
      :hide-time-zone="filterUi.scalar.input.hideTimeZone"
      :hour-cycle="filterUi.scalar.input.hourCycle"
      leading-icon="i-lucide-calendar-days"
      class="w-full"
      @update:model-value="setSingleDate"
    />
  </FilterPanelFieldShell>
</template>
