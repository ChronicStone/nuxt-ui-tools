<script setup lang="ts">
import { Time } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import UButton from '@nuxt/ui/components/Button.vue'
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UInputTime from '@nuxt/ui/components/InputTime.vue'
import type { InputTimeProps } from '@nuxt/ui/components/InputTime.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref, shallowRef, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue } from '../../types'
import { isNumber, isString } from '../../utils/predicate'
import type { FormDateField } from '../date/types'
import type { FormDateFamilyField, FormDateManualInputOptions } from './types'
import {
  applyDateManualMask,
  calendarRangeFromCanonical,
  calendarSeedFromValue,
  calendarValueFromCanonical,
  canonicalDateFromValue,
  canonicalDateToJsDate,
  dateFamilyCalendarType,
  dateManualPlaceholder,
  defaultDateManualFormat,
  formatDateManualValue,
  hasDateFamilyTime,
  isDateFamilyRange,
  parseDateManualValue,
  serializeCalendarValue,
  serializeTimeValue,
  timeRangeFromCanonical,
  timeValueFromCanonical,
} from './utils'
import type {
  FormCalendarRangeValue,
  FormDateFamilyType,
  FormTimeRangeValue,
} from './utils'

interface ResolvedManualInput extends FormDateManualInputOptions {
  enabled: boolean
  mask: boolean
}

type TimeInputModel = InputTimeProps<boolean>['modelValue']
type TimeRangeInputModel = InputTimeProps<true>['modelValue']

const props = defineProps<{
  field: FormDateField | FormDateFamilyField
  path: readonly string[]
}>()

const { locale, t } = useUiToolsLocale()
const {
  form,
  controlProps,
  controlSize,
  disabled,
  handleBlur,
  interactionOwnerClass,
  placeholder: fieldPlaceholder,
} = useFieldControl(
  () => props.field,
  () => props.path,
)

const root = ref<HTMLElement | null>(null)
const open = ref<boolean>(false)
const manualEditing = ref<boolean>(false)
const inputValue = ref<string>('')
const draftRange = shallowRef<FormCalendarRangeValue | null>(null)
const type = computed<FormDateFamilyType>(() => props.field.type)
const isRange = computed<boolean>(() => isDateFamilyRange(type.value))
const hasTime = computed<boolean>(() => hasDateFamilyTime(type.value))
const calendarType = computed(() => dateFamilyCalendarType(type.value))
const value = computed(() => form.getValue(props.path))
const selectedValues = computed<readonly [string, string]>(() => {
  if (!isRange.value) return [canonicalDateFromFormValue(value.value), '']
  if (!Array.isArray(value.value)) return ['', '']
  return [canonicalDateFromFormValue(value.value[0]), canonicalDateFromFormValue(value.value[1])]
})
const manualInput = computed<ResolvedManualInput>(() => {
  const configured = props.field.manualInput
  if (configured === false) return { enabled: false, mask: true }
  if (configured === true || configured === undefined) return { enabled: true, mask: true }
  return {
    ...configured,
    enabled: configured.enabled !== false,
    mask: configured.mask !== false,
  }
})
const manualFormat = computed(
  () =>
    manualInput.value.format ??
    props.field.manualInputFormat ??
    defaultDateManualFormat(type.value, locale.value.code),
)
const placeholder = computed(() => {
  const explicitlyConfigured = Object.getOwnPropertyDescriptor(props.field, 'placeholder')?.value
  if (explicitlyConfigured !== undefined) return fieldPlaceholder.value
  return (
    manualInput.value.placeholder ?? dateManualPlaceholder(manualFormat.value, isRange.value)
  )
})
const previewValue = computed(() => {
  if (!isRange.value) return formatPreviewPart(selectedValues.value[0])

  const start = formatPreviewPart(selectedValues.value[0])
  const end = formatPreviewPart(selectedValues.value[1])
  if (!start && !end) return ''
  return `${start || t('form.fields.date.start')} – ${end || t('form.fields.date.end')}`
})
const manualValue = computed(() =>
  formatDateManualValue(selectedValues.value, manualFormat.value, type.value),
)
const singleCalendarValue = computed<DateValue | undefined>(() =>
  calendarValueFromCanonical(type.value, selectedValues.value[0]),
)
const committedRangeValue = computed<FormCalendarRangeValue | null>(() =>
  calendarRangeFromCanonical(type.value, selectedValues.value),
)
const rangeCalendarValue = computed<FormCalendarRangeValue | null>(
  () => draftRange.value ?? committedRangeValue.value,
)
const minCanonical = computed(() => resolveCalendarBound('min'))
const maxCanonical = computed(() => resolveCalendarBound('max'))
const minCalendarValue = computed<DateValue | undefined>(() =>
  calendarValueFromCanonical(type.value, minCanonical.value),
)
const maxCalendarValue = computed<DateValue | undefined>(() =>
  calendarValueFromCanonical(type.value, maxCanonical.value),
)
const singleTimeValue = computed<Time | undefined>(() =>
  timeValueFromCanonical(selectedValues.value[0]),
)
const rangeTimeValue = computed<FormTimeRangeValue>(() =>
  timeRangeFromCanonical(selectedValues.value),
)
const minuteStep = computed<number>(() => {
  if (!('minuteStep' in props.field) || !isNumber(props.field.minuteStep)) return 1
  return Math.min(60, Math.max(1, Math.round(props.field.minuteStep)))
})
const timeStep = computed<{ minute: number }>(() => ({ minute: minuteStep.value }))
const calendarUi = computed(() => ({ root: 'p-2', heading: 'min-w-0' }))

watch(
  selectedValues,
  () => {
    if (!manualEditing.value) inputValue.value = previewValue.value
  },
  { immediate: true },
)

function handleFocus() {
  if (manualInput.value.enabled) {
    manualEditing.value = true
    inputValue.value = manualValue.value
  }
  open.value = true
}

function handleClick() {
  open.value = true
}

function handleInput(next: string | number) {
  if (!manualInput.value.enabled) return

  const raw = String(next)
  inputValue.value = manualInput.value.mask
    ? applyDateManualMask(raw, manualFormat.value, isRange.value)
    : raw

  if (!inputValue.value.trim()) {
    clearValue()
    return
  }

  commitManualInput(inputValue.value)
}

function handleInputBlur(event: FocusEvent) {
  if (manualInput.value.enabled) commitManualInput(inputValue.value)
  manualEditing.value = false
  inputValue.value = previewValue.value
  handleBlur(event)
}

function handleManualConfirm() {
  if (manualInput.value.enabled) commitManualInput(inputValue.value)
  manualEditing.value = false
  inputValue.value = previewValue.value
  open.value = false
}

function handleOpenUpdate(next: boolean) {
  open.value = next
  if (next) return

  draftRange.value = null
  if (root.value?.contains(document.activeElement)) return
  manualEditing.value = false
  inputValue.value = previewValue.value
}

function handlePopoverEscape() {
  const input = root.value?.querySelector('input')
  if (input && document.activeElement === input) input.blur()
  manualEditing.value = false
  inputValue.value = previewValue.value
}

function updateSingleCalendar(
  next: DateValue | FormCalendarRangeValue | DateValue[] | null | undefined,
) {
  if (!next || Array.isArray(next) || isCalendarRangeValue(next)) return

  const canonical = serializeCalendarValue(type.value, next, selectedValues.value[0])
  if (!isWithinBounds(canonical)) return
  setStoredPart(0, canonical)
  if (!hasTime.value) open.value = false
}

function updateRangeCalendar(next: FormCalendarRangeValue | null) {
  draftRange.value = next
  if (!next?.start || !next.end) return

  const start = serializeCalendarValue(type.value, next.start, selectedValues.value[0])
  const end = serializeCalendarValue(type.value, next.end, selectedValues.value[1])
  if (start > end || !isWithinBounds(start) || !isWithinBounds(end)) return

  setStoredRange(start, end)
  draftRange.value = null
  if (!hasTime.value) open.value = false
}

function updateSingleTime(next: TimeInputModel) {
  if (!next || 'start' in next || !selectedValues.value[0]) return
  setStoredPart(0, serializeTimeValue(selectedValues.value[0], next))
}

function updateRangeTime(next: TimeRangeInputModel) {
  if (
    !next?.start ||
    !next.end ||
    !selectedValues.value[0] ||
    !selectedValues.value[1]
  )
    return
  setStoredRange(
    serializeTimeValue(selectedValues.value[0], next.start),
    serializeTimeValue(selectedValues.value[1], next.end),
  )
}

function commitManualInput(raw: string) {
  const parsed = parseDateManualValue(raw, manualFormat.value, type.value)
  if (!parsed) return false

  if (!isString(parsed)) {
    if (!isWithinBounds(parsed[0]) || !isWithinBounds(parsed[1])) return false
    setStoredRange(parsed[0], parsed[1])
    return true
  }

  if (!isWithinBounds(parsed)) return false
  setStoredPart(0, parsed)
  return true
}

function setStoredPart(part: 0 | 1, canonical: string) {
  if (isRange.value) {
    const next: [string, string] = [selectedValues.value[0], selectedValues.value[1]]
    next[part] = canonical
    if (next[0] && next[1]) setStoredRange(next[0], next[1])
    return
  }

  if (props.field.type === 'date' && props.field.outputFormat === 'date') {
    const date = canonicalDateToJsDate(canonical)
    if (date) form.setValue(props.path, date)
    return
  }

  form.setValue(props.path, canonical || null)
}

function setStoredRange(start: string, end: string) {
  form.setValue(props.path, [start, end])
}

function clearValue() {
  form.setValue(props.path, null)
  draftRange.value = null
  inputValue.value = ''
}

function canonicalDateFromFormValue(value: FormValue) {
  if (value instanceof Date || isString(value) || isNumber(value) || value == null)
    return canonicalDateFromValue(value)
  return ''
}

function resolveCalendarBound(edge: 'min' | 'max') {
  const configured = edge === 'min' ? props.field.min : props.field.max
  const direct = calendarSeedFromValue(configured, type.value)
  if (direct) return normalizeCalendarBound(direct, edge)

  const yearRange = props.field.calendar?.yearRange
  if (!yearRange) return ''
  const year = edge === 'min' ? yearRange[0] : yearRange[1]
  if (type.value === 'year') return String(year)
  if (type.value === 'month' || type.value === 'monthrange')
    return `${year}-${edge === 'min' ? '01' : '12'}`
  return normalizeCalendarBound(`${year}-${edge === 'min' ? '01-01' : '12-31'}`, edge)
}

function normalizeCalendarBound(value: string, edge: 'min' | 'max') {
  if (!hasTime.value || value.includes('T')) return value
  return `${value}T${edge === 'min' ? '00:00' : '23:59'}`
}

function isWithinBounds(canonical: string) {
  if (minCanonical.value && canonical < minCanonical.value) return false
  if (maxCanonical.value && canonical > maxCanonical.value) return false
  return true
}

function formatPreviewPart(canonical: string) {
  if (!canonical) return ''
  if (type.value === 'year') return canonical.slice(0, 4)

  const date = canonicalDateToJsDate(canonical)
  if (!date) return canonical

  if (type.value === 'month' || type.value === 'monthrange')
    return new Intl.DateTimeFormat(locale.value.code, {
      month: 'long',
      year: 'numeric',
    }).format(date)

  const options = resolvePreviewFormat()
  return new Intl.DateTimeFormat(locale.value.code, options).format(date)
}

function resolvePreviewFormat(): Intl.DateTimeFormatOptions {
  if (props.field.type === 'date' && props.field.previewFormat) return props.field.previewFormat
  if (hasTime.value) return { dateStyle: 'medium', timeStyle: 'short' }
  return { dateStyle: 'medium' }
}

function preventPopoverAutoFocus(event: Event) {
  event.preventDefault()
}

function isCalendarRangeValue(
  candidate: DateValue | FormCalendarRangeValue,
): candidate is FormCalendarRangeValue {
  return 'start' in candidate || 'end' in candidate
}


</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div ref="root" class="w-full">
      <UPopover
        :open="open"
        :content="{
          side: 'bottom',
          align: 'start',
          sideOffset: 8,
          collisionPadding: 12,
          avoidCollisions: true,
          onOpenAutoFocus: preventPopoverAutoFocus,
          onCloseAutoFocus: preventPopoverAutoFocus,
          onEscapeKeyDown: handlePopoverEscape,
        }"
        :ui="{ content: `${interactionOwnerClass} data-[state=closed]:hidden` }"
        @update:open="handleOpenUpdate"
      >
        <template #anchor>
          <UInput
            :model-value="inputValue"
            v-bind="controlProps"
            class="w-full"
            inputmode="numeric"
            autocomplete="off"
            leading-icon="i-lucide-calendar-days"
            :readonly="!manualInput.enabled"
            :placeholder="placeholder"
            :disabled="disabled"
            @update:model-value="handleInput"
            @focus="handleFocus"
            @click="handleClick"
            @blur="handleInputBlur"
            @keydown.enter.prevent="handleManualConfirm"
          >
            <template v-if="field.clearable === true && value" #trailing>
              <UButton
                type="button"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="disabled"
                :aria-label="t('form.fields.date.clear')"
                @mousedown.prevent
                @click.stop="clearValue"
              />
            </template>
          </UInput>
        </template>

        <template #content>
          <div class="grid gap-3 p-1">
            <UCalendar
              v-if="isRange"
              :model-value="rangeCalendarValue"
              range
              :type="calendarType"
              :size="controlSize"
              :min-value="minCalendarValue"
              :max-value="maxCalendarValue"
              :month-controls="field.calendar?.monthControls ?? true"
              :year-controls="field.calendar?.yearControls ?? true"
              :week-numbers="field.calendar?.weekNumbers ?? false"
              :number-of-months="field.calendar?.numberOfMonths"
              :view-control="{ trailingIcon: 'i-lucide-chevron-down', class: 'font-medium' }"
              :ui="calendarUi"
              @update:model-value="updateRangeCalendar"
            />
            <UCalendar
              v-else
              :model-value="singleCalendarValue"
              :type="calendarType"
              :size="controlSize"
              :min-value="minCalendarValue"
              :max-value="maxCalendarValue"
              :month-controls="field.calendar?.monthControls ?? true"
              :year-controls="field.calendar?.yearControls ?? true"
              :week-numbers="field.calendar?.weekNumbers ?? false"
              :number-of-months="field.calendar?.numberOfMonths"
              :view-control="{ trailingIcon: 'i-lucide-chevron-down', class: 'font-medium' }"
              :ui="calendarUi"
              @update:model-value="updateSingleCalendar"
            />

            <div v-if="hasTime" class="grid gap-3 border-t border-default p-2">
              <UInputTime
                v-if="isRange"
                :model-value="rangeTimeValue"
                range
                granularity="minute"
                :hour-cycle="24"
                :step="timeStep"
                step-snapping
                :locale="locale.code"
                :size="controlSize"
                :disabled="disabled || !selectedValues[0] || !selectedValues[1]"
                @update:model-value="updateRangeTime"
              />
              <UInputTime
                v-else
                :model-value="singleTimeValue"
                granularity="minute"
                :hour-cycle="24"
                :step="timeStep"
                step-snapping
                :locale="locale.code"
                :size="controlSize"
                :disabled="disabled || !selectedValues[0]"
                @update:model-value="updateSingleTime"
              />

              <div class="flex items-center justify-end gap-2">
                <UButton
                  v-if="field.clearable === true && value"
                  type="button"
                  color="neutral"
                  variant="ghost"
                  :size="controlSize"
                  @click="clearValue"
                >
                  {{ t('form.fields.date.clear') }}
                </UButton>
                <UButton
                  type="button"
                  color="neutral"
                  variant="soft"
                  :size="controlSize"
                  :disabled="!value"
                  @click="handleManualConfirm"
                >
                  {{ t('form.fields.date.confirm') }}
                </UButton>
              </div>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </FormFieldShell>
</template>
