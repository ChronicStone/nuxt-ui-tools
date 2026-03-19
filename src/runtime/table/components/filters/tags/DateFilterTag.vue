<script setup lang="ts">
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import UButton from '@nuxt/ui/components/Button.vue'
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableDateFilterDefinition, TableFilterOperator } from '../../../types'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableDateFilterDefinition
}>()

const internals = useTableInternals()
const isOpen = ref<boolean>(false)
const pendingOperator = ref<TableFilterOperator>()

// --- Local calendar state (only committed on Apply) ---
const localDate = ref<CalendarDate>()
const localDateRange = ref<{ start: CalendarDate; end: CalendarDate }>()

let dismissLocked = false

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  dismissLocked = true
  setTimeout(() => {
    isOpen.value = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dismissLocked = false
      })
    })
  })
}

function initLocalState() {
  const rule = internals.filters.getFilterState({ key: props.definition.key })

  if (operator.value === 'between') {
    const range =
      rule?.value &&
      typeof rule.value === 'object' &&
      !Array.isArray(rule.value) &&
      !(rule.value instanceof Date)
        ? rule.value
        : undefined

    const start = range?.from ? toCalendarDate(range.from) : undefined
    const end = range?.to ? toCalendarDate(range.to) : undefined
    localDateRange.value = start && end ? { start, end } : undefined
    return
  }

  if (!rule?.value) {
    localDate.value = undefined
    return
  }

  const date = rule.value instanceof Date ? rule.value : new Date(String(rule.value))
  localDate.value = Number.isNaN(date.getTime())
    ? undefined
    : new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function handleOpenChange(open: boolean) {
  if (!open && dismissLocked) return
  isOpen.value = open
  if (open) {
    initLocalState()
  } else {
    pendingOperator.value = undefined
  }
}

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
  }),
)

const operator = computed(
  () =>
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    }),
)

const operatorLabel = computed(
  () =>
    internals.filters
      .getFilterOperatorOptions({
        key: props.definition.key,
      })
      .find((item) => item.value === operator.value)?.label ?? 'is',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const rangeSummary = computed(() => {
  if (!localDateRange.value) return ''

  return [localDateRange.value.start, localDateRange.value.end]
    .map((value) => {
      if (!value) return ''
      const date = value.toDate(getLocalTimeZone())
      return date.toISOString().slice(0, 10)
    })
    .filter(Boolean)
    .join(' - ')
})

function applyFilter() {
  const op = pendingOperator.value
  const currentOperator = operator.value
  pendingOperator.value = undefined

  if (currentOperator === 'between') {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: localDateRange.value
        ? {
            from: localDateRange.value.start.toDate(getLocalTimeZone()),
            to: localDateRange.value.end.toDate(getLocalTimeZone()),
          }
        : undefined,
      operator: op,
    })
  } else {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: localDate.value ? localDate.value.toDate(getLocalTimeZone()) : undefined,
      operator: op,
    })
  }

  isOpen.value = false
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  isOpen.value = false
}

function toCalendarDate(value: unknown) {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    return undefined
  }

  const resolvedDate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(resolvedDate.getTime())) {
    return undefined
  }

  return new CalendarDate(
    resolvedDate.getFullYear(),
    resolvedDate.getMonth() + 1,
    resolvedDate.getDate(),
  )
}
</script>

<template>
  <UPopover
    :open="isOpen"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'max-w-[calc(100vw-1rem)] p-0 shadow-none',
    }"
    @update:open="handleOpenChange"
  >
    <TableFilterTrigger
      :label="internals.filters.getFilterLabelText({ label: definition.label })"
      leading-icon="i-lucide-calendar"
      :operator-label="operatorLabel"
      :operator-items="operatorItems"
      :preview-summary="preview.summary"
      :active="preview.active"
      @select-operator="
        internals.filters.setFilterOperator({ key: definition.key, operator: $event })
      "
      @activate="handleActivate"
      @clear="clearFilter"
    />

    <template #content>
      <div class="overflow-hidden rounded-sm border border-default bg-default">
        <div v-if="operator === 'between'" class="grid gap-3 p-3">
          <div class="rounded-sm border border-default bg-elevated/30 px-3 py-2 text-sm text-toned">
            {{ rangeSummary || 'Select a date range' }}
          </div>

          <UCalendar
            v-model="localDateRange"
            range
            color="neutral"
            size="md"
            :number-of-months="2"
            :fixed-weeks="true"
            :month-controls="true"
            :year-controls="true"
            :ui="{
              root: 'border-0 bg-transparent p-0 shadow-none',
              header: 'px-1 pb-2',
              body: 'gap-4',
              grid: 'gap-y-1',
              cell: 'p-0.5',
              cellTrigger: 'rounded-sm',
            }"
          />
        </div>

        <div v-else class="p-3">
          <UCalendar
            v-model="localDate"
            color="neutral"
            size="md"
            :fixed-weeks="true"
            :month-controls="true"
            :year-controls="true"
            :ui="{
              root: 'border-0 bg-transparent p-0 shadow-none',
              header: 'px-1 pb-2',
              grid: 'gap-y-1',
              cell: 'p-0.5',
              cellTrigger: 'rounded-sm',
            }"
          />
        </div>

        <div class="flex items-center justify-between border-t border-default p-2">
          <UButton color="neutral" variant="ghost" size="sm" label="Clear" @click="clearFilter" />
          <UButton color="neutral" variant="subtle" size="sm" label="Apply" @click="applyFilter" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
