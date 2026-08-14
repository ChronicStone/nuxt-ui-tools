<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import USlider from '@nuxt/ui/components/Slider.vue'
import { computed, ref, watch } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableNumberFilterDefinition,
  TableNumberFilterOperator,
} from '../../../types'
import {
  mergeDataListUiClass,
  resolveFilterTriggerIcon,
  resolveNumberFilterUi,
} from '../../../utils'
import FilterMatchModePanel from '../shared/FilterMatchModePanel.vue'
import FilterPopoverShell from '../shared/FilterPopoverShell.vue'
import FilterStageTransition from '../shared/FilterStageTransition.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableNumberFilterDefinition
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
const pendingOperator = ref<TableFilterOperator | undefined>(props.initialOperator)
const localValue = ref<string>('')
const rangeValue = ref<{ from: string; to: string }>({ from: '', to: '' })
const stage = ref<'editor' | 'match-mode'>('editor')
const stageDirection = ref<'forward' | 'backward'>('forward')
const stageTransitioning = ref<boolean>(false)

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
  }),
)

const operator = computed<TableNumberFilterOperator>(() => {
  const value =
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    })

  return value === 'isNot' ||
    value === 'gt' ||
    value === 'gte' ||
    value === 'lt' ||
    value === 'lte' ||
    value === 'between'
    ? value
    : 'is'
})

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

const filterUi = computed(() => resolveNumberFilterUi(props.definition, operator.value))

const scalarValue = computed<number | undefined>({
  get() {
    return localValue.value === '' ? undefined : Number(localValue.value)
  },
  set(value) {
    localValue.value = value == null || Number.isNaN(value) ? '' : String(value)
  },
})

const sliderBounds = computed(() => ({
  min: filterUi.value.min ?? 0,
  max: filterUi.value.max ?? 100,
}))

const sliderRangeValue = computed<number[]>(() => [
  rangeValue.value.from === '' ? sliderBounds.value.min : Number(rangeValue.value.from),
  rangeValue.value.to === '' ? sliderBounds.value.max : Number(rangeValue.value.to),
])

const session = useFilterTagSession({
  session: props.session,
  dynamic: props.dynamic,
  embedded: props.embedded,
  hasCommittedState: () =>
    internals.filters.getActiveFilterState({ key: props.definition.key }) != null,
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

function initLocalState() {
  const value = internals.filters.getFilterState({
    key: props.definition.key,
  })?.value

  if (operator.value === 'between') {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      rangeValue.value = {
        from: value.from == null ? '' : String(value.from),
        to: value.to == null ? '' : String(value.to),
      }
    } else {
      rangeValue.value = { from: '', to: '' }
    }

    localValue.value = ''
    return
  }

  localValue.value = value == null ? '' : String(value)
  rangeValue.value = { from: '', to: '' }
}

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

function handleOperatorChange(op: TableFilterOperator) {
  localValue.value = ''
  rangeValue.value = { from: '', to: '' }

  pendingOperator.value = op
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'editor'
}

function commitIfAuto() {
  if (filterUi.value.commitMode === 'auto') applyFilter()
}

function applyFilter() {
  const nextOperator = pendingOperator.value
  pendingOperator.value = undefined

  if (operator.value === 'between') {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value:
        rangeValue.value.from === '' && rangeValue.value.to === ''
          ? undefined
          : {
              ...(rangeValue.value.from === '' ? {} : { from: Number(rangeValue.value.from) }),
              ...(rangeValue.value.to === '' ? {} : { to: Number(rangeValue.value.to) }),
            },
      operator: nextOperator,
    })
    session.close()
    return
  }

  internals.filters.setScalarFilterValue({
    key: props.definition.key,
    value: scalarValue.value,
    operator: nextOperator,
  })
  session.close()
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  session.close()
}

function updateScalarValue(value: number | undefined) {
  scalarValue.value = value
  commitIfAuto()
}

function updateRangeFrom(value: number | undefined) {
  rangeValue.value = {
    ...rangeValue.value,
    from: value == null ? '' : String(value),
  }
  commitIfAuto()
}

function updateRangeTo(value: number | undefined) {
  rangeValue.value = {
    ...rangeValue.value,
    to: value == null ? '' : String(value),
  }
  commitIfAuto()
}

function updateSliderScalarValue(value: unknown) {
  if (typeof value !== 'number') return
  scalarValue.value = value
  commitIfAuto()
}

function updateSliderRangeValue(value: unknown) {
  if (!Array.isArray(value) || value.length < 2) return

  const [from, to] = value
  if (typeof from !== 'number' || typeof to !== 'number') return

  rangeValue.value = {
    from: String(from),
    to: String(to),
  }
  commitIfAuto()
}

function resolveIncrementConfig(hideStepper: boolean) {
  return hideStepper ? false : { variant: 'ghost' as const }
}
</script>

<template>
  <FilterPopoverShell
    :open="session.isOpen.value"
    :embedded="embedded"
    :transitioning="stageTransitioning"
    :content-class="
      mergeDataListUiClass('w-fit overflow-hidden p-0', undefined, dataListFilterUi?.popoverContent)
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
              'min-w-[16rem] max-w-[calc(100vw-1rem)] bg-default',
              undefined,
              dataListFilterUi?.editor,
            )
          "
        >
          <div
            v-if="operator === 'between'"
            :class="
              mergeDataListUiClass(
                'grid gap-3 border-b border-default p-3',
                undefined,
                dataListFilterUi?.inputs,
              )
            "
          >
            <div
              v-if="
                filterUi.range.display === 'inputs' || filterUi.range.display === 'inputs-slider'
              "
              class="grid grid-cols-2 gap-2"
            >
              <UInputNumber
                :model-value="rangeValue.from === '' ? undefined : Number(rangeValue.from)"
                :placeholder="filterUi.range.inputs.fromPlaceholder"
                :min="filterUi.min"
                :max="filterUi.max"
                :step="filterUi.step"
                :format-options="filterUi.formatOptions"
                :disable-wheel-change="filterUi.range.inputs.disableWheelChange"
                :increment="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
                :decrement="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
                :size="size"
                :ui="{
                  base: 'h-9 px-2',
                  increment: 'size-7 rounded-md',
                  decrement: 'size-7 rounded-md',
                }"
                @update:model-value="updateRangeFrom"
                @keydown.enter.prevent="applyFilter"
              />

              <UInputNumber
                :model-value="rangeValue.to === '' ? undefined : Number(rangeValue.to)"
                :placeholder="filterUi.range.inputs.toPlaceholder"
                :min="filterUi.min"
                :max="filterUi.max"
                :step="filterUi.step"
                :format-options="filterUi.formatOptions"
                :disable-wheel-change="filterUi.range.inputs.disableWheelChange"
                :increment="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
                :decrement="resolveIncrementConfig(filterUi.range.inputs.hideStepper)"
                :size="size"
                :ui="{
                  base: 'h-9 px-2',
                  increment: 'size-7 rounded-md',
                  decrement: 'size-7 rounded-md',
                }"
                @update:model-value="updateRangeTo"
                @keydown.enter.prevent="applyFilter"
              />
            </div>

            <USlider
              v-if="
                filterUi.range.display === 'slider' || filterUi.range.display === 'inputs-slider'
              "
              :model-value="sliderRangeValue"
              :min="filterUi.range.slider.min ?? sliderBounds.min"
              :max="filterUi.range.slider.max ?? sliderBounds.max"
              :step="filterUi.range.slider.step ?? filterUi.step"
              :min-steps-between-thumbs="filterUi.range.minGap"
              :tooltip="filterUi.range.slider.showTooltip"
              :class="dataListFilterUi?.slider"
              @update:model-value="updateSliderRangeValue"
            />
          </div>

          <div
            v-else
            :class="
              mergeDataListUiClass(
                'grid gap-3 border-b border-default p-3',
                undefined,
                dataListFilterUi?.inputs,
              )
            "
          >
            <UInputNumber
              v-if="
                filterUi.scalar.display === 'input' || filterUi.scalar.display === 'input-slider'
              "
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
              :ui="{
                base: 'h-9 px-2',
                increment: 'size-7 rounded-md',
                decrement: 'size-7 rounded-md',
              }"
              @update:model-value="updateScalarValue"
              @keydown.enter.prevent="applyFilter"
            />

            <USlider
              v-if="
                filterUi.scalar.display === 'slider' || filterUi.scalar.display === 'input-slider'
              "
              :model-value="scalarValue"
              :min="filterUi.scalar.slider.min ?? sliderBounds.min"
              :max="filterUi.scalar.slider.max ?? sliderBounds.max"
              :step="filterUi.scalar.slider.step ?? filterUi.step"
              :tooltip="filterUi.scalar.slider.showTooltip"
              :class="dataListFilterUi?.slider"
              @update:model-value="updateSliderScalarValue"
            />
          </div>

          <div
            v-if="filterUi.commitMode === 'manual'"
            :class="
              mergeDataListUiClass(
                'flex items-center justify-between border-t border-default p-2',
                undefined,
                dataListFilterUi?.footer,
              )
            "
          >
            <UButton
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
      </FilterStageTransition>
    </template>
  </FilterPopoverShell>
</template>
