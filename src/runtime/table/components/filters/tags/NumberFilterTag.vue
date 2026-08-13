<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import USlider from '@nuxt/ui/components/Slider.vue'
import { computed, ref, toRef, watch } from 'vue'

import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableNumberFilterDefinition,
  TableNumberFilterOperator,
} from '../../../types'
import { resolveFilterTriggerIcon, resolveNumberFilterUi } from '../../../utils'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableNumberFilterDefinition
  dynamic?: boolean
  session?: boolean
  activationToken?: number
}>()
const emit = defineEmits<{
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const pendingOperator = ref<TableFilterOperator>()
const localValue = ref<string>('')
const rangeValue = ref<{ from: string; to: string }>({ from: '', to: '' })

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
  activationToken: toRef(props, 'activationToken'),
  session: props.session,
  dynamic: props.dynamic,
  hasCommittedState: () => internals.filters.getFilterState({ key: props.definition.key }) != null,
  onActivated: () => handleActivate(operator.value),
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
  const value = internals.filters.getFilterState({ key: props.definition.key })?.value

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
  session.openWithLock()
}

function handleOperatorChange(op: TableFilterOperator) {
  if (filterUi.value.clearOnOperatorChange) {
    internals.filters.clearFilter({ key: props.definition.key })
  }

  localValue.value = ''
  rangeValue.value = { from: '', to: '' }

  if (filterUi.value.reopenOnOperatorChange) handleActivate(op)
  else pendingOperator.value = op
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
  <UPopover
    :open="session.isOpen.value"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{ content: 'w-fit overflow-hidden p-0 shadow-none' }"
    @update:open="session.handleOpenChange"
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
        :operator-label="operatorLabel"
        :operator-items="operatorItems"
        :preview-summary="preview.summary"
        :active="preview.active"
        @select-operator="handleOperatorChange"
        @activate="handleActivate"
        @clear="clearFilter"
      />
    </slot>

    <template #content>
      <div class="min-w-[16rem] max-w-[calc(100vw-1rem)] bg-default">
        <div v-if="operator === 'between'" class="grid gap-3 border-b border-default p-3">
          <div
            v-if="filterUi.range.display === 'inputs' || filterUi.range.display === 'inputs-slider'"
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
            v-if="filterUi.range.display === 'slider' || filterUi.range.display === 'inputs-slider'"
            :model-value="sliderRangeValue"
            :min="filterUi.range.slider.min ?? sliderBounds.min"
            :max="filterUi.range.slider.max ?? sliderBounds.max"
            :step="filterUi.range.slider.step ?? filterUi.step"
            :min-steps-between-thumbs="filterUi.range.minGap"
            :tooltip="filterUi.range.slider.showTooltip"
            @update:model-value="updateSliderRangeValue"
          />
        </div>

        <div v-else class="grid gap-3 border-b border-default p-3">
          <UInputNumber
            v-if="filterUi.scalar.display === 'input' || filterUi.scalar.display === 'input-slider'"
            :model-value="scalarValue"
            :placeholder="filterUi.scalar.input.placeholder"
            :min="filterUi.min"
            :max="filterUi.max"
            :step="filterUi.step"
            :format-options="filterUi.formatOptions"
            :disable-wheel-change="filterUi.scalar.input.disableWheelChange"
            :increment="resolveIncrementConfig(filterUi.scalar.input.hideStepper)"
            :decrement="resolveIncrementConfig(filterUi.scalar.input.hideStepper)"
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
            @update:model-value="updateSliderScalarValue"
          />
        </div>

        <div
          v-if="filterUi.commitMode === 'manual'"
          class="flex items-center justify-between border-t border-default p-2"
        >
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :label="filterUi.actions.clear"
            @click="clearFilter"
          />
          <UButton
            color="neutral"
            variant="subtle"
            size="sm"
            :label="filterUi.actions.apply"
            @click="applyFilter"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
