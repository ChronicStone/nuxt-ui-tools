<script setup lang="ts">
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormDateField } from '../../types'

interface CalendarDay {
  key: string
  date: Date
  label: string
  inMonth: boolean
  today: boolean
  selected: boolean
  disabled: boolean
}

const props = defineProps<{
  field: FormDateField
  path: readonly string[]
}>()

const { locale } = useUiToolsLocale()
const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const calendarOpen = ref<boolean>(false)
const inputFocused = ref<boolean>(false)
const inputValue = ref<string>('')
const panelMonth = ref<number>(new Date().getMonth())
const panelYear = ref<number>(new Date().getFullYear())
const model = computed<CalendarDate | undefined>({
  get: () => coerceCalendarDate(form.getValue(props.path)),
  set: (value) => form.setValue(props.path, value ? serializeCalendarDate(value) : null),
})
const selectedDate = computed(() => model.value?.toDate(getLocalTimeZone()))
const minDate = computed(() => coerceDate(props.field.min))
const maxDate = computed(() => coerceDate(props.field.max))
const manualFormat = computed(() => props.field.manualInput?.format ?? defaultManualFormat())
const manualPlaceholder = computed(
  () => props.field.manualInput?.placeholder ?? manualFormat.value.toLowerCase(),
)
const previewFormatter = computed(
  () =>
    new Intl.DateTimeFormat(
      locale.value.code,
      props.field.previewFormat ?? {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    ),
)
const monthItems = computed(() =>
  Array.from({ length: 12 }, (_, month) => ({
    label: new Intl.DateTimeFormat(locale.value.code, { month: 'long' }).format(
      new Date(panelYear.value, month, 1),
    ),
    value: month,
  })),
)
const yearItems = computed(() => {
  const range = props.field.calendar?.yearRange ?? [
    new Date().getFullYear() - 100,
    new Date().getFullYear() + 25,
  ]
  const years: { label: string; value: number }[] = []
  for (let year = range[0]; year <= range[1]; year += 1)
    years.push({ label: String(year), value: year })
  return years
})
const weekDays = computed(() => {
  const base = startOfWeek(new Date(2026, 0, 4))
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale.value.code, { weekday: 'short' }).format(addDays(base, index)),
  )
})
const calendarWeeks = computed<readonly (readonly CalendarDay[])[]>(() => {
  const start = startOfWeek(new Date(panelYear.value, panelMonth.value, 1))
  return Array.from({ length: 6 }, (_week, weekIndex) =>
    Array.from({ length: 7 }, (_day, dayIndex) =>
      createCalendarDay(addDays(start, weekIndex * 7 + dayIndex)),
    ),
  )
})

watch(
  model,
  (value) => {
    const date = value?.toDate(getLocalTimeZone())
    if (date) {
      panelMonth.value = date.getMonth()
      panelYear.value = date.getFullYear()
    }
    if (!inputFocused.value) inputValue.value = date ? formatPreviewDate(date) : ''
  },
  { immediate: true },
)

function handleFocus() {
  inputFocused.value = true
  openCalendar()
  inputValue.value = selectedDate.value ? formatManualDate(selectedDate.value) : ''
}

function handleInput(value: string | number) {
  inputValue.value = applyManualMask(String(value))
}

async function handleInputBlur() {
  inputFocused.value = false
  const parsed = parseManualDate(inputValue.value)
  if (parsed) model.value = toCalendarDate(parsed)
  inputValue.value = selectedDate.value ? formatPreviewDate(selectedDate.value) : ''
  await handleBlur()
}

function openCalendar() {
  const date = selectedDate.value ?? new Date()
  panelMonth.value = date.getMonth()
  panelYear.value = date.getFullYear()
  calendarOpen.value = true
}

async function selectDate(day: CalendarDay) {
  if (day.disabled) return
  model.value = toCalendarDate(day.date)
  inputValue.value = formatPreviewDate(day.date)
  calendarOpen.value = false
  await handleBlur()
}

async function clearDate() {
  model.value = undefined
  inputValue.value = ''
  await handleBlur()
}

function createCalendarDay(date: Date): CalendarDay {
  return {
    key: date.toISOString(),
    date,
    label: String(date.getDate()),
    inMonth: date.getMonth() === panelMonth.value,
    today: isSameDay(date, new Date()),
    selected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
    disabled: isDateDisabled(date),
  }
}

function isDateDisabled(date: Date) {
  if (minDate.value && startOfDay(date).getTime() < startOfDay(minDate.value).getTime()) return true
  if (maxDate.value && startOfDay(date).getTime() > startOfDay(maxDate.value).getTime()) return true
  return false
}

function defaultManualFormat() {
  return locale.value.code.toLowerCase().startsWith('fr') ? 'dd/MM/yyyy' : 'MM/dd/yyyy'
}

function formatPreviewDate(date: Date) {
  return previewFormatter.value.format(date)
}

function formatManualDate(date: Date) {
  const day = padDatePart(date.getDate())
  const month = padDatePart(date.getMonth() + 1)
  const year = String(date.getFullYear())
  if (manualFormat.value === 'dd/MM/yyyy') return `${day}/${month}/${year}`
  if (manualFormat.value === 'yyyy-MM-dd') return `${year}-${month}-${day}`
  return `${month}/${day}/${year}`
}

function parseManualDate(value: string) {
  const parts = value.match(/\d+/g)
  if (!parts || parts.length < 3) return undefined

  const first = Number(parts[0])
  const second = Number(parts[1])
  const third = Number(parts[2])
  const date =
    manualFormat.value === 'yyyy-MM-dd'
      ? new Date(first, second - 1, third)
      : manualFormat.value === 'dd/MM/yyyy'
        ? new Date(third, second - 1, first)
        : new Date(third, first - 1, second)

  return Number.isNaN(date.getTime()) || !matchesParts(date, first, second, third)
    ? undefined
    : date
}

function matchesParts(date: Date, first: number, second: number, third: number) {
  if (manualFormat.value === 'yyyy-MM-dd')
    return (
      date.getFullYear() === first && date.getMonth() === second - 1 && date.getDate() === third
    )
  if (manualFormat.value === 'dd/MM/yyyy')
    return (
      date.getDate() === first && date.getMonth() === second - 1 && date.getFullYear() === third
    )
  return date.getMonth() === first - 1 && date.getDate() === second && date.getFullYear() === third
}

function applyManualMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (manualFormat.value === 'yyyy-MM-dd') return joinDateParts(digits, [4, 2, 2], '-')
  return joinDateParts(digits, [2, 2, 4], '/')
}

function joinDateParts(value: string, sizes: readonly number[], separator: string) {
  const parts: string[] = []
  let offset = 0
  for (const size of sizes) {
    const part = value.slice(offset, offset + size)
    if (part) parts.push(part)
    offset += size
  }
  return parts.join(separator)
}

function coerceCalendarDate(value: unknown) {
  const date = coerceDate(value)
  return date ? toCalendarDate(date) : undefined
}

function coerceDate(value: unknown) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
  if (isCalendarDateLike(value))
    return new CalendarDate(value.year, value.month, value.day).toDate(getLocalTimeZone())
  if (typeof value !== 'string' && typeof value !== 'number') return undefined

  const parsed = typeof value === 'string' ? parseIsoDate(value) : new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function isCalendarDateLike(value: unknown): value is { year: number; month: number; day: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'year' in value &&
    'month' in value &&
    'day' in value &&
    typeof value.year === 'number' &&
    typeof value.month === 'number' &&
    typeof value.day === 'number'
  )
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return new Date(value)

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function toCalendarDate(value: Date) {
  return new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate())
}

function serializeCalendarDate(value: CalendarDate) {
  if (props.field.outputFormat === 'date') return value.toDate(getLocalTimeZone())
  return value.toString()
}

function startOfWeek(value: Date) {
  return addDays(startOfDay(value), -startOfDay(value).getDay())
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function addDays(value: Date, days: number) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days)
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UPopover
      v-model:open="calendarOpen"
      :content="{ side: 'bottom', sideOffset: 8, collisionPadding: 12, avoidCollisions: true }"
    >
      <template #anchor>
        <UInput
          :model-value="inputValue"
          v-bind="controlProps"
          class="w-full"
          leading
          leading-icon="i-lucide-calendar-days"
          :placeholder="manualPlaceholder"
          :disabled="disabled"
          @update:model-value="handleInput"
          @focus="handleFocus"
          @click="handleFocus"
          @blur="handleInputBlur"
        >
          <template v-if="field.clearable === true && model" #trailing>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="disabled"
              aria-label="Clear date"
              @mousedown.prevent
              @click="clearDate"
            />
          </template>
        </UInput>
      </template>

      <template #content>
        <div data-form-date-panel class="grid w-80 gap-3 p-1">
          <div class="flex gap-2">
            <USelect
              v-model="panelMonth"
              :items="monthItems"
              value-key="value"
              label-key="label"
              class="min-w-0 flex-1"
              size="sm"
              :portal="false"
            />
            <USelect
              v-model="panelYear"
              :items="yearItems"
              value-key="value"
              label-key="label"
              class="min-w-0 flex-1"
              size="sm"
              :portal="false"
            />
          </div>

          <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
            <span v-for="weekday in weekDays" :key="weekday">{{ weekday }}</span>
          </div>

          <div class="grid gap-1">
            <div
              v-for="(week, weekIndex) in calendarWeeks"
              :key="weekIndex"
              class="grid grid-cols-7 gap-1"
            >
              <button
                v-for="day in week"
                :key="day.key"
                type="button"
                class="grid size-8 place-items-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :class="[
                  day.selected ? 'bg-primary text-inverted' : 'hover:bg-elevated',
                  day.today && !day.selected ? 'font-semibold text-primary' : '',
                  day.inMonth ? 'text-highlighted' : 'text-muted',
                  day.disabled ? 'pointer-events-none opacity-40' : '',
                ]"
                :disabled="day.disabled"
                @click="selectDate(day)"
              >
                {{ day.label }}
              </button>
            </div>
          </div>

          <div
            class="flex items-center justify-between gap-2 border-t border-default pt-2 text-xs text-muted"
          >
            <span class="truncate">
              {{ selectedDate ? formatPreviewDate(selectedDate) : manualPlaceholder }}
            </span>
            <UIcon name="i-lucide-calendar-check" class="size-4 shrink-0" />
          </div>
        </div>
      </template>
    </UPopover>
  </FormFieldShell>
</template>
