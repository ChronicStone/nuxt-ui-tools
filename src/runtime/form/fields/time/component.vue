<script setup lang="ts">
import { Time } from '@internationalized/date'
import UButton from '@nuxt/ui/components/Button.vue'
import UInputTime from '@nuxt/ui/components/InputTime.vue'
import type { InputTimeProps } from '@nuxt/ui/components/InputTime.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormTimeField } from '../../types'
import { isNumber, isString } from '../../utils/predicate'

type TimeInputModel = InputTimeProps<boolean>['modelValue']

const props = defineProps<{
  field: FormTimeField
  path: readonly string[]
}>()

const { locale, t } = useUiToolsLocale()
const { form, controlProps, controlSize, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)

const model = computed<Time | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return isString(value) ? parseTime(value) : undefined
  },
  set: (value) => form.setValue(props.path, value ? serializeTime(value) : null),
})
const minuteStep = computed<number>(() =>
  resolveMinuteStep(props.field.minuteStep, props.field.step),
)
const timeStep = computed<{ minute: number }>(() => ({ minute: minuteStep.value }))
const minValue = computed<Time | undefined>(() => parseTime(props.field.min))
const maxValue = computed<Time | undefined>(() => parseTime(props.field.max))

function updateTime(value: TimeInputModel) {
  if (!value) {
    clearTime()
    return
  }
  if ('start' in value) return
  form.setValue(props.path, serializeTime(value))
}

function clearTime() {
  model.value = undefined
}

function resolveMinuteStep(
  configuredMinuteStep: number | undefined,
  secondStep: number | undefined,
) {
  if (isNumber(configuredMinuteStep) && configuredMinuteStep > 0)
    return Math.min(60, Math.max(1, Math.round(configuredMinuteStep)))
  if (isNumber(secondStep) && secondStep >= 60)
    return Math.min(60, Math.max(1, Math.round(secondStep / 60)))
  return 1
}

function parseTime(value: string | undefined) {
  if (!value) return undefined
  const match = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(value)
  if (!match) return undefined

  const hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined
  return new Time(hour, minute)
}

function serializeTime(value: { hour: number; minute: number }) {
  return `${pad(value.hour)}:${pad(value.minute)}`
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UInputTime
      :model-value="model"
      v-bind="controlProps"
      class="w-full"
      granularity="minute"
      :hour-cycle="24"
      :step="timeStep"
      step-snapping
      :locale="locale.code"
      :min-value="minValue"
      :max-value="maxValue"
      :size="controlSize"
      :disabled="disabled"
      @update:model-value="updateTime"
      @blur="handleBlur"
    >
      <template v-if="field.clearable === true && model" #trailing>
        <UButton
          type="button"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="disabled"
          :aria-label="t('form.fields.time.clear')"
          @mousedown.prevent
          @click.stop="clearTime"
        />
      </template>
    </UInputTime>
  </FormFieldShell>
</template>
