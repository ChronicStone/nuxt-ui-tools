<script setup lang="ts">
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import UButton from '@nuxt/ui/components/Button.vue'
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import UInputDate from '@nuxt/ui/components/InputDate.vue'
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableDateFilterOperator, TableFilterOperator } from '../../../types'
import type { TableDateFilterDefinition } from '../../../types/filters'
import {
  formatFilterDate,
  getDateRangeValue,
  mergeDataListUiClass,
  resolveFilterTriggerIcon,
  resolveDateFilterRangeCalendarPanels,
  resolveDateFilterRangePresets,
  resolveDateFilterScalarPresets,
  resolveDateFilterUi,
} from '../../../utils'
import FilterMatchModePanel from '../shared/FilterMatchModePanel.vue'
import FilterPopoverShell from '../shared/FilterPopoverShell.vue'
import FilterStageTransition from '../shared/FilterStageTransition.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableDateFilterDefinition
  dynamic?: boolean
  session?: boolean
  embedded?: boolean
  initialOperator?: TableFilterOperator
}>()
const emit = defineEmits<{
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const dataListFilterUi = computed(() => dataListUi.ui.value.filterTags?.ui)
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const { t } = useUiToolsLocale()
const isMobile = useMediaQuery('(max-width: 639px)')
const pendingOperator = ref<TableFilterOperator | undefined>(props.initialOperator)
const localDate = shallowRef<CalendarDate | undefined>(undefined)
const localRangeStart = shallowRef<CalendarDate | undefined>(undefined)
const localRangeEnd = shallowRef<CalendarDate | undefined>(undefined)
const stage = ref<'editor' | 'match-mode'>('editor')
const stageDirection = ref<'forward' | 'backward'>('forward')
const stageTransitioning = ref<boolean>(false)

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
  }),
)

const operator = computed<TableDateFilterOperator>(() => {
  const value =
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    })

  return value === 'isNot' || value === 'before' || value === 'after' || value === 'between'
    ? value
    : 'is'
})

const filterUi = computed(() => resolveDateFilterUi(props.definition, operator.value))

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

const scalarPresets = computed(() =>
  resolveDateFilterScalarPresets({
    definition: props.definition,
    operator:
      operator.value === 'before' || operator.value === 'after' || operator.value === 'isNot'
        ? operator.value
        : 'is',
  }),
)

const rangePresets = computed(() =>
  resolveDateFilterRangePresets({
    definition: props.definition,
  }),
)

const rangeCalendarPanels = computed(() =>
  resolveDateFilterRangeCalendarPanels({
    definition: props.definition,
    mobile: isMobile.value,
  }),
)

const calendarRange = computed<
  | {
      start: CalendarDate
      end: CalendarDate
    }
  | undefined
>(() => {
  if (!localRangeStart.value || !localRangeEnd.value) return undefined

  return {
    start: localRangeStart.value,
    end: localRangeEnd.value,
  }
})

const rangeSummary = computed(() => {
  const from = localRangeStart.value ? toJsDate(localRangeStart.value) : undefined
  const to = localRangeEnd.value ? toJsDate(localRangeEnd.value) : undefined

  if (from && to) return `${formatFilterDate({ value: from })} - ${formatFilterDate({ value: to })}`
  if (from) return `${t('table.filters.operators.after')} ${formatFilterDate({ value: from })}`
  if (to) return `${t('table.filters.operators.before')} ${formatFilterDate({ value: to })}`
  return t('table.filters.preview.empty')
})

const session = useFilterTagSession({
  session: props.session,
  dynamic: props.dynamic,
  embedded: props.embedded,
  hasCommittedState: () => internals.filters.getFilterState({ key: props.definition.key }) != null,
  onOpen: initLocalState,
  onClose: () => {
    pendingOperator.value = undefined
  },
  onSessionClosed: () => emit('sessionClosed'),
  onDismiss: () => emit('dismiss'),
})

watch(
  () => operator.value,
  () => {
    if (session.isOpen.value) initLocalState()
  },
)

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  stage.value = 'editor'
  stageDirection.value = 'backward'
  session.open()
}

function handleRequestMatchMode() {
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'match-mode'
  session.open()
}

function initLocalState() {
  const rule = internals.filters.getFilterState({ key: props.definition.key })

  if (operator.value === 'between') {
    const range = getDateRangeValue({
      value: rule?.value,
    })

    localRangeStart.value = range?.from ? toCalendarDate(range.from) : undefined
    localRangeEnd.value = range?.to ? toCalendarDate(range.to) : undefined
    localDate.value = undefined
    return
  }

  const date =
    rule?.value instanceof Date
      ? rule.value
      : rule?.value
        ? new Date(String(rule.value))
        : undefined

  localDate.value = date ? toCalendarDate(date) : undefined
  localRangeStart.value = undefined
  localRangeEnd.value = undefined
}

function applyFilter() {
  const currentOperator = operator.value
  const nextOperator = pendingOperator.value
  pendingOperator.value = undefined

  if (currentOperator === 'between') {
    const from = localRangeStart.value ? toJsDate(localRangeStart.value) : undefined
    const to = localRangeEnd.value ? toJsDate(localRangeEnd.value) : undefined

    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : undefined,
      operator: nextOperator,
    })
    session.close()
    return
  }

  internals.filters.setScalarFilterValue({
    key: props.definition.key,
    value: localDate.value ? toJsDate(localDate.value) : undefined,
    operator: nextOperator,
  })
  session.close()
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  localDate.value = undefined
  localRangeStart.value = undefined
  localRangeEnd.value = undefined
  session.close()
}

function handleOperatorChange(op: TableFilterOperator) {
  localDate.value = undefined
  localRangeStart.value = undefined
  localRangeEnd.value = undefined

  pendingOperator.value = op
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'editor'
}

function applyScalarPreset(value: Date) {
  localDate.value = toCalendarDate(value)
  if (filterUi.value.commitMode === 'auto') applyFilter()
}

function applyRangePreset(value: { from?: Date; to?: Date }) {
  localRangeStart.value = value.from ? toCalendarDate(value.from) : undefined
  localRangeEnd.value = value.to ? toCalendarDate(value.to) : undefined
  if (filterUi.value.commitMode === 'auto') applyFilter()
}

function isRangePresetActive(value: { from?: Date; to?: Date }) {
  const fromMatches = areSameCalendarDay(localRangeStart.value, toCalendarDate(value.from))
  const toMatches = areSameCalendarDay(localRangeEnd.value, toCalendarDate(value.to))
  return fromMatches && toMatches
}

function setSingleDate(value: unknown) {
  localDate.value = coerceCalendarDate(value)
  if (filterUi.value.commitMode === 'auto') applyFilter()
}

function setRangeStart(value: unknown) {
  localRangeStart.value = coerceCalendarDate(value)
  if (filterUi.value.commitMode === 'auto' && filterUi.value.range.display === 'inputs') {
    applyFilter()
  }
}

function setRangeEnd(value: unknown) {
  localRangeEnd.value = coerceCalendarDate(value)
  if (filterUi.value.commitMode === 'auto' && filterUi.value.range.display === 'inputs') {
    applyFilter()
  }
}

function setCalendarRange(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    localRangeStart.value = undefined
    localRangeEnd.value = undefined
    return
  }

  localRangeStart.value = 'start' in value ? coerceCalendarDate(value.start) : undefined
  localRangeEnd.value = 'end' in value ? coerceCalendarDate(value.end) : undefined

  if (filterUi.value.commitMode === 'auto' && filterUi.value.range.display === 'calendar') {
    applyFilter()
  }
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
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    return undefined
  }

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

function areSameCalendarDay(left: CalendarDate | undefined, right: CalendarDate | undefined) {
  if (!left && !right) return true
  if (!left || !right) return false

  return left.year === right.year && left.month === right.month && left.day === right.day
}
</script>

<template>
  <FilterPopoverShell
    :open="session.isOpen.value"
    :embedded="embedded"
    :transitioning="stageTransitioning"
    :content-class="
      mergeDataListUiClass(
        'max-w-[calc(100vw-1rem)] overflow-hidden p-0',
        undefined,
        dataListFilterUi?.popoverContent,
      )
    "
    @update-open="session.handleOpenChange"
  >
    <slot
      name="trigger"
      :preview="preview"
      :active="preview.active"
      :open="session.isOpen.value"
      :trigger-props="{
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': session.isOpen.value,
      }"
    >
      <TableFilterTrigger
        :label="internals.filters.getFilterLabelText({ label: definition.label })"
        :leading-icon="resolveFilterTriggerIcon(definition)"
        :operator="operator"
        :operator-label="operatorLabel"
        :operator-items="operatorItems"
        :preview-summary="preview.summary"
        :active="preview.active"
        @activate="handleActivate"
        @request-match-mode="handleRequestMatchMode"
        @clear="clearFilter"
      />
    </slot>

    <template #content>
      <FilterStageTransition
        :stage-key="stage"
        :direction="stageDirection"
        @settled="stageTransitioning = false"
      >
        <FilterMatchModePanel
          v-if="stage === 'match-mode'"
          :items="operatorItems"
          :selected="operator"
          :size="size"
          :ui="dataListFilterUi"
          @select="handleOperatorChange"
        />
        <div
          v-else
          :class="
            mergeDataListUiClass(
              `bg-default ${operator === 'between' ? 'w-[min(100vw-1rem,48rem)]' : 'w-[min(100vw-1rem,22rem)]'}`,
              undefined,
              dataListFilterUi?.editor,
            )
          "
        >
          <div v-if="operator === 'between'">
            <div
              class="grid gap-0"
              :class="
                filterUi.range.presetsPlacement === 'side'
                  ? 'lg:grid-cols-[14rem_minmax(0,1fr)]'
                  : 'grid-cols-1'
              "
            >
              <div
                v-if="rangePresets.length"
                :class="
                  mergeDataListUiClass(
                    `border-b border-default p-3 ${filterUi.range.presetsPlacement === 'side' ? 'lg:border-r lg:border-b-0' : ''}`,
                    undefined,
                    dataListFilterUi?.presets,
                  )
                "
              >
                <div class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  Date range
                </div>

                <div
                  class="mt-3 flex gap-1.5"
                  :class="filterUi.range.presetsPlacement === 'side' ? 'flex-col' : 'flex-wrap'"
                >
                  <UButton
                    v-for="preset in rangePresets"
                    :key="preset.label"
                    :variant="isRangePresetActive(preset.value) ? 'subtle' : 'ghost'"
                    :size="size"
                    :class="
                      mergeDataListUiClass(
                        'justify-start rounded-lg px-3',
                        undefined,
                        dataListFilterUi?.preset,
                      )
                    "
                    @click="applyRangePreset(preset.value)"
                  >
                    {{ preset.label }}
                  </UButton>
                </div>
              </div>

              <div
                v-if="filterUi.range.display !== 'inputs'"
                :class="mergeDataListUiClass('p-3', undefined, dataListFilterUi?.calendar)"
              >
                <UCalendar
                  :model-value="calendarRange"
                  range
                  :number-of-months="rangeCalendarPanels"
                  :paged-navigation="
                    filterUi.range.calendar.pagedNavigation ?? rangeCalendarPanels > 1
                  "
                  :fixed-weeks="filterUi.range.calendar.fixedWeeks"
                  :maximum-days="filterUi.range.calendar.maxRangeDays"
                  :ui="{
                    header: 'px-1 pb-2',
                    body: 'gap-3',
                    grid: 'gap-y-1',
                    cell: 'p-0.5',
                    cellTrigger: 'rounded-md',
                    root: mergeDataListUiClass(
                      'border-0 bg-transparent p-0',
                      undefined,
                      dataListFilterUi?.calendar,
                    ),
                  }"
                  @update:model-value="setCalendarRange"
                />
              </div>
            </div>

            <div
              v-if="filterUi.range.display !== 'calendar'"
              :class="
                mergeDataListUiClass(
                  'border-t border-default px-3 py-3',
                  undefined,
                  dataListFilterUi?.inputs,
                )
              "
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  Custom range
                </div>
                <div class="truncate text-xs text-muted">
                  {{ rangeSummary }}
                </div>
              </div>

              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <div class="space-y-1">
                  <span class="px-1 text-xs text-muted">Start</span>
                  <UInputDate
                    :model-value="localRangeStart"
                    leading
                    :fixed="filterUi.range.input.fixed"
                    :highlight="filterUi.range.input.highlight"
                    :granularity="filterUi.range.input.granularity"
                    :hide-time-zone="filterUi.range.input.hideTimeZone"
                    :hour-cycle="filterUi.range.input.hourCycle"
                    leading-icon="i-lucide-arrow-right"
                    :size="size"
                    class="w-full"
                    @update:model-value="setRangeStart"
                  />
                </div>

                <div class="space-y-1">
                  <span class="px-1 text-xs text-muted">End</span>
                  <UInputDate
                    :model-value="localRangeEnd"
                    leading
                    :fixed="filterUi.range.input.fixed"
                    :highlight="filterUi.range.input.highlight"
                    :granularity="filterUi.range.input.granularity"
                    :hide-time-zone="filterUi.range.input.hideTimeZone"
                    :hour-cycle="filterUi.range.input.hourCycle"
                    leading-icon="i-lucide-arrow-left"
                    :size="size"
                    class="w-full"
                    @update:model-value="setRangeEnd"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            :class="mergeDataListUiClass('grid gap-2 p-3', undefined, dataListFilterUi?.inputs)"
          >
            <div
              v-if="scalarPresets.length"
              :class="
                mergeDataListUiClass('flex flex-wrap gap-1.5', undefined, dataListFilterUi?.presets)
              "
            >
              <UButton
                v-for="preset in scalarPresets"
                :key="preset.label"
                variant="ghost"
                :size="size"
                :class="
                  mergeDataListUiClass('rounded-lg px-3', undefined, dataListFilterUi?.preset)
                "
                @click="applyScalarPreset(preset.value)"
              >
                {{ preset.label }}
              </UButton>
            </div>

            <UInputDate
              v-if="
                filterUi.scalar.display === 'input' || filterUi.scalar.display === 'input-calendar'
              "
              :model-value="localDate"
              leading
              :fixed="filterUi.scalar.input.fixed"
              :highlight="filterUi.scalar.input.highlight"
              :granularity="filterUi.scalar.input.granularity"
              :hide-time-zone="filterUi.scalar.input.hideTimeZone"
              :hour-cycle="filterUi.scalar.input.hourCycle"
              leading-icon="i-lucide-calendar-days"
              :size="size"
              class="w-full"
              @update:model-value="setSingleDate"
            />

            <UCalendar
              v-if="
                filterUi.scalar.display === 'calendar' ||
                filterUi.scalar.display === 'input-calendar'
              "
              :model-value="localDate"
              :fixed-weeks="filterUi.scalar.calendar.fixedWeeks"
              :ui="{
                root: mergeDataListUiClass(
                  'border-0 bg-transparent p-0',
                  undefined,
                  dataListFilterUi?.calendar,
                ),
                header: 'px-1 pb-2',
                grid: 'gap-y-1',
                cell: 'p-0.5',
                cellTrigger: 'rounded-md',
              }"
              @update:model-value="setSingleDate"
            />
          </div>

          <div
            v-if="filterUi.commitMode === 'manual'"
            :class="
              mergeDataListUiClass(
                `flex items-center border-t border-default p-2 ${operator === 'between' ? 'justify-between' : 'justify-end'}`,
                undefined,
                dataListFilterUi?.footer,
              )
            "
          >
            <UButton
              v-if="operator === 'between'"
              color="neutral"
              variant="ghost"
              :size="size"
              :label="filterUi.actions.clear"
              :ui="{ base: dataListFilterUi?.clear }"
              @click="clearFilter"
            />
            <div class="flex items-center gap-2">
              <UButton
                v-if="operator !== 'between'"
                color="neutral"
                variant="ghost"
                :size="size"
                :label="filterUi.actions.clear"
                :ui="{ base: dataListFilterUi?.clear }"
                @click="clearFilter"
              />
              <UButton
                color="neutral"
                variant="subtle"
                :size="size"
                :label="filterUi.actions.apply"
                :ui="{ base: dataListFilterUi?.apply }"
                @click="applyFilter"
              />
            </div>
          </div>
        </div>
      </FilterStageTransition>
    </template>
  </FilterPopoverShell>
</template>
