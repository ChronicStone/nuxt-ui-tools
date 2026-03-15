<script setup lang="ts">
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import { computed, ref } from 'vue'

import UButton from '@nuxt/ui/components/Button.vue'
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'

import TableFilterTrigger from '../shared/FilterTriggerTag.vue'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableDateFilterDefinition } from '../../../types'

const props = defineProps<{
  definition: TableDateFilterDefinition
}>()

const internals = useTableInternals()
const isOpen = ref<boolean>(false)
const pendingOperator = ref<string>()

let dismissLocked = false

function handleActivate(op: string) {
  pendingOperator.value = op
  dismissLocked = true
  setTimeout(() => {
    isOpen.value = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { dismissLocked = false })
    })
  })
}

function handleOpenChange(open: boolean) {
  if (!open && dismissLocked) return
  isOpen.value = open
  if (!open) {
    pendingOperator.value = undefined
  }
}

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
  }),
)

const operator = computed(() =>
  pendingOperator.value ??
  internals.filters.getFilterOperator({
    key: props.definition.key,
  }),
)

const operatorLabel = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }).find((item: { label: string; value: string }) => item.value === operator.value)?.label ?? 'is',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const calendarValue = computed({
  get() {
    const rule = internals.filters.getFilterState({
      key: props.definition.key,
    })

    if (!rule?.value) {
      return undefined
    }

    const date = rule.value instanceof Date ? rule.value : new Date(String(rule.value))
    if (Number.isNaN(date.getTime())) {
      return undefined
    }

    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set(value?: CalendarDate) {
    const op = pendingOperator.value
    pendingOperator.value = undefined
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: value ? value.toDate(getLocalTimeZone()) : undefined,
      operator: op,
    })
  },
})

const rangeCalendarValue = computed<any>({
  get() {
    const rule = internals.filters.getFilterState({
      key: props.definition.key,
    })
    const range =
      rule?.value && typeof rule.value === 'object' && !Array.isArray(rule.value) && !(rule.value instanceof Date)
        ? rule.value
        : undefined

    if (!range?.from && !range?.to) {
      return undefined
    }

    return {
      ...(range.from ? { start: toCalendarDate(range.from) } : {}),
      ...(range.to ? { end: toCalendarDate(range.to) } : {}),
    }
  },
  set(value) {
    const op = pendingOperator.value
    pendingOperator.value = undefined
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: {
        from: value?.start ? value.start.toDate(getLocalTimeZone()) : undefined,
        to: value?.end ? value.end.toDate(getLocalTimeZone()) : undefined,
      },
      operator: op,
    })
  },
})

const rangeSummary = computed(() => {
  const rule = internals.filters.getFilterState({
    key: props.definition.key,
  })
  const range =
    rule?.value && typeof rule.value === 'object' && !Array.isArray(rule.value) && !(rule.value instanceof Date)
      ? rule.value
      : undefined

  if (!range) {
    return ''
  }

  return [range.from, range.to]
    .map((value) => toDateInputValue(value))
    .filter(Boolean)
    .join(' - ')
})

function toDateInputValue(value: unknown) {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    return ''
  }

  const resolvedDate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(resolvedDate.getTime())) {
    return ''
  }

  return resolvedDate.toISOString().slice(0, 10)
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
      content: 'rounded-xl p-0 shadow-xl'
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
      @select-operator="internals.filters.setFilterOperator({ key: definition.key, operator: $event })"
      @activate="handleActivate"
      @clear="internals.filters.clearFilter({ key: definition.key }); isOpen = false"
    />

    <template #content>
      <div class="overflow-hidden rounded-xl border border-default bg-default">
        <div v-if="operator === 'between'" class="grid gap-3 p-3">
          <div
            class="rounded-lg border border-default bg-elevated/30 px-3 py-2 text-sm text-toned"
          >
            {{ rangeSummary || 'Select a date range' }}
          </div>

          <UCalendar
            v-model="rangeCalendarValue"
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
              cellTrigger: 'rounded-lg'
            }"
          />
        </div>

        <div v-else class="p-3">
          <UCalendar
            v-model="calendarValue"
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
              cellTrigger: 'rounded-lg'
            }"
          />
        </div>

        <div class="border-t border-default p-2">
          <UButton
            color="neutral"
            variant="ghost"
            size="lg"
            block
            label="Clear filters"
            @click="internals.filters.clearFilter({ key: definition.key })"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
