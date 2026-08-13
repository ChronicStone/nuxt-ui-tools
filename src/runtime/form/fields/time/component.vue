<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormTimeField } from '../../types'

const props = defineProps<{
  field: FormTimeField
  path: readonly string[]
}>()
const { t } = useUiToolsLocale()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
const open = ref<boolean>(false)
const inputFocused = ref<boolean>(false)
const inputValue = ref<string>('')
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'string' ? value : undefined
  },
  set: (value) => form.setValue(props.path, value || null),
})
const minuteStep = computed(() => resolveMinuteStep(props.field.minuteStep, props.field.step))
const hours = computed(() => Array.from({ length: 24 }, (_item, hour) => padTimePart(hour)))
const minutes = computed(() => {
  const step = minuteStep.value
  const values: string[] = []
  for (let minute = 0; minute < 60; minute += step) values.push(padTimePart(minute))
  return values
})
const selectedParts = computed(() => parseTime(model.value))
const selectedHour = computed<string | undefined>({
  get: () => selectedParts.value?.hour,
  set: (value) => {
    if (typeof value === 'string') selectPart('hour', value)
  },
})
const selectedMinute = computed<string | undefined>({
  get: () => selectedParts.value?.minute,
  set: (value) => {
    if (typeof value === 'string') selectPart('minute', value)
  },
})

watch(
  model,
  (value) => {
    if (!inputFocused.value) inputValue.value = value ?? ''
  },
  { immediate: true },
)

function handleFocus() {
  inputFocused.value = true
  inputValue.value = model.value ?? ''
  open.value = true
}

function handleInput(value: string | number) {
  inputValue.value = maskTime(String(value))
}

async function handleInputBlur() {
  inputFocused.value = false
  const parsed = normalizeTime(inputValue.value)
  if (parsed) model.value = parsed
  inputValue.value = model.value ?? ''
  await handleBlur()
}

function selectPart(type: 'hour' | 'minute', value: string) {
  const current = parseTime(model.value) ?? { hour: '09', minute: '00' }
  const next = type === 'hour' ? `${value}:${current.minute}` : `${current.hour}:${value}`
  model.value = next
  inputValue.value = next
}

function selectTime(value: string) {
  model.value = value
  inputValue.value = value
}

async function clearTime() {
  model.value = undefined
  inputValue.value = ''
  await handleBlur()
}

function resolveMinuteStep(
  configuredMinuteStep: number | undefined,
  secondStep: number | undefined,
) {
  if (typeof configuredMinuteStep === 'number' && configuredMinuteStep > 0)
    return Math.min(60, Math.max(1, Math.round(configuredMinuteStep)))
  if (typeof secondStep === 'number' && secondStep >= 60)
    return Math.min(60, Math.max(1, Math.round(secondStep / 60)))
  return 5
}

function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function normalizeTime(value: string) {
  const parts = parseTime(value)
  if (!parts) return undefined
  return `${parts.hour}:${parts.minute}`
}

function parseTime(value: string | undefined) {
  const match = /^(\d{1,2})(?::?(\d{1,2}))?$/.exec(value ?? '')
  if (!match) return undefined

  const hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined

  return {
    hour: padTimePart(hour),
    minute: padTimePart(minute),
  }
}

function padTimePart(value: number) {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UPopover
      v-model:open="open"
      :content="{ side: 'bottom', sideOffset: 8, collisionPadding: 12, avoidCollisions: true }"
    >
      <template #anchor>
        <UInput
          :model-value="inputValue"
          v-bind="controlProps"
          class="w-full"
          inputmode="numeric"
          leading-icon="i-lucide-clock"
          :placeholder="placeholder ?? t('form.fields.time.format')"
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
              :aria-label="t('form.fields.time.clear')"
              @mousedown.prevent
              @click="clearTime"
            />
          </template>
        </UInput>
      </template>

      <template #content>
        <div class="grid w-72 gap-3 p-1">
          <div class="grid grid-cols-2 gap-2">
            <USelect
              v-model="selectedHour"
              :items="hours"
              class="min-w-0"
              size="sm"
              :placeholder="t('form.fields.time.hour')"
              :portal="false"
            />
            <USelect
              v-model="selectedMinute"
              :items="minutes"
              class="min-w-0"
              size="sm"
              :placeholder="t('form.fields.time.minute')"
              :portal="false"
            />
          </div>
          <div class="grid grid-cols-4 gap-1">
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              block
              @mousedown.prevent
              @click="selectTime('09:00')"
              >09:00</UButton
            >
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              block
              @mousedown.prevent
              @click="selectTime('12:00')"
              >12:00</UButton
            >
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              block
              @mousedown.prevent
              @click="selectTime('14:00')"
              >14:00</UButton
            >
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              block
              @mousedown.prevent
              @click="selectTime('18:00')"
              >18:00</UButton
            >
          </div>
          <p class="text-xs text-muted">
            {{ model ?? t('form.fields.time.format') }}
          </p>
        </div>
      </template>
    </UPopover>
  </FormFieldShell>
</template>
