<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormDateFamilyField } from './types'

const props = defineProps<{
  field: FormDateFamilyField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
const range = computed<boolean>(() =>
  ['daterange', 'monthrange', 'datetimerange'].includes(props.field.type),
)
const inputType = computed<'date' | 'datetime-local' | 'month' | 'number'>(() => {
  if (props.field.type === 'datetime' || props.field.type === 'datetimerange')
    return 'datetime-local'
  if (props.field.type === 'month' || props.field.type === 'monthrange') return 'month'
  if (props.field.type === 'year') return 'number'
  return 'date'
})
const singleModel = computed<string>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'string' ? value : ''
  },
  set: (value) => form.setValue(props.path, value || null),
})
const startModel = computed<string>({
  get: () => rangeValue(0),
  set: (value) => setRangeValue(0, value),
})
const endModel = computed<string>({
  get: () => rangeValue(1),
  set: (value) => setRangeValue(1, value),
})
const min = computed<string | number | undefined>(() => props.field.min)
const max = computed<string | number | undefined>(() => props.field.max)

function rangeValue(index: 0 | 1) {
  const value = form.getValue(props.path)
  if (!Array.isArray(value)) return ''
  return typeof value[index] === 'string' ? value[index] : ''
}

function setRangeValue(index: 0 | 1, value: string) {
  const current = form.getValue(props.path)
  const next: [string, string] = Array.isArray(current)
    ? [stringValue(current[0]), stringValue(current[1])]
    : ['', '']
  next[index] = value
  form.setValue(props.path, next[0] || next[1] ? next : null)
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

async function clear() {
  form.setValue(props.path, null)
  await handleBlur()
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div class="flex items-center gap-2">
      <template v-if="range">
        <UInput
          v-model="startModel"
          v-bind="controlProps"
          class="min-w-0 flex-1"
          :type="inputType"
          :min="min"
          :max="max"
          :disabled="disabled"
          aria-label="Start"
          @blur="handleBlur"
        />
        <span class="text-sm text-muted" aria-hidden="true">–</span>
        <UInput
          v-model="endModel"
          v-bind="controlProps"
          class="min-w-0 flex-1"
          :type="inputType"
          :min="startModel || min"
          :max="max"
          :disabled="disabled"
          aria-label="End"
          @blur="handleBlur"
        />
      </template>
      <UInput
        v-else
        v-model="singleModel"
        v-bind="controlProps"
        class="min-w-0 flex-1"
        :type="inputType"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        :disabled="disabled"
        @blur="handleBlur"
      />
      <UButton
        v-if="field.clearable === true && form.getValue(path)"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        :disabled="disabled"
        aria-label="Clear value"
        @click="clear"
      />
    </div>
  </FormFieldShell>
</template>
