<script setup lang="ts">
import { computed } from 'vue'

import UFormField from '@nuxt/ui/components/FormField.vue'

import type { FormField } from '../../types'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { createFormFieldInstance } from '../../utils/field-instance'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormField
  path: readonly string[]
}>()

const form = useFormRuntimeContext()
const field = computed(() => createFormFieldInstance(props.field))

const label = computed(() => field.value.capability.has('label') && 'label' in props.field ? resolveFormText(props.field.label) : undefined)
const description = computed(() => field.value.capability.has('description') && 'description' in props.field ? resolveFormText(props.field.description) : undefined)
const hint = computed(() => field.value.capability.has('hint') && 'hint' in props.field ? resolveFormText(props.field.hint) : undefined)
const error = computed(() => form.getFieldError(props.path))
const required = computed(() => {
  if (!field.value.capability.has('validation')) return false
  const validation = Object.getOwnPropertyDescriptor(props.field, 'validation')?.value
  if (typeof validation !== 'object' || validation === null || Array.isArray(validation)) return false
  const value = Object.getOwnPropertyDescriptor(validation, 'required')?.value
  if (typeof value === 'function') return value(form.getFieldCallbackParams(props.path, props.field)) === true
  return typeof value === 'boolean' ? value : false
})
</script>

<template>
  <UFormField
    :name="path.join('.')"
    :label="label"
    :description="description"
    :hint="hint"
    :error="error"
    :required="required"
  >
    <slot />
  </UFormField>
</template>
