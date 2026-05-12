<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

import UAlert from '@nuxt/ui/components/Alert.vue'

import type { FormField, FormFieldType, FormItemLayout } from '../../types'
import { childParentPath, fieldPath, useFormRuntimeContext } from '../../composables/use-form-runtime'
import { createFormFieldInstance } from '../../utils/field-instance'
import { getSchemaLayout } from '../../utils/state'
import ArrayListField from '../../fields/array-list/component.vue'
import CheckboxField from '../../fields/checkbox/component.vue'
import CustomComponentField from '../../fields/custom-component/component.vue'
import DateField from '../../fields/date/component.vue'
import DividerField from '../../fields/divider/component.vue'
import HiddenField from '../../fields/hidden/component.vue'
import InfoField from '../../fields/info/component.vue'
import InputGroupField from '../../fields/input-group/component.vue'
import NumberField from '../../fields/number/component.vue'
import ObjectField from '../../fields/object/component.vue'
import PasswordField from '../../fields/password/component.vue'
import RadioField from '../../fields/radio/component.vue'
import SelectField from '../../fields/select/component.vue'
import TextField from '../../fields/text/component.vue'
import TextareaField from '../../fields/textarea/component.vue'

const props = defineProps<{
  field: FormField
  parentPath: readonly string[]
}>()

const form = useFormRuntimeContext()
const field = computed(() => createFormFieldInstance(props.field))
const path = computed(() => fieldPath(props.parentPath, props.field))
const childPath = computed(() => childParentPath(props.parentPath, props.field))
const visible = computed(() => form.shouldRender(props.field, path.value))
const renderer = computed(() => fieldRenderers.get(field.value.type.value) ?? null)
const rendererProps = computed(() => {
  const baseProps = {
    field: props.field,
    path: path.value,
  }
  if (!field.value.type.isAny(['input-group', 'object'])) return baseProps

  return {
    ...baseProps,
    parentPath: childPath.value,
  }
})
const wrapperStyle = computed(() => ({
  gridColumn: normalizeSpan(resolveFieldLayout()?.span ?? getSchemaLayout(form.schema.value)?.fieldSpan),
}))

const fieldRenderers = new Map<FormFieldType, Component>([
  ['text', TextField],
  ['password', PasswordField],
  ['textarea', TextareaField],
  ['number', NumberField],
  ['checkbox', CheckboxField],
  ['select', SelectField],
  ['radio', RadioField],
  ['date', DateField],
  ['hidden', HiddenField],
  ['info', InfoField],
  ['divider', DividerField],
  ['input-group', InputGroupField],
  ['object', ObjectField],
  ['custom-component', CustomComponentField],
  ['array-list', ArrayListField],
  ['array-tabs', ArrayListField],
  ['array-variant', ArrayListField],
])

function resolveFieldLayout(): FormItemLayout | undefined {
  if (!field.value.capability.has('itemLayout')) return undefined
  const layout = Object.getOwnPropertyDescriptor(props.field, 'layout')?.value
  return isLayout(layout) ? layout : undefined
}

function normalizeSpan(value: number | string | undefined) {
  if (value === 'full') return '1 / -1'
  if (typeof value === 'number') return `span ${value} / span ${value}`
  if (typeof value === 'string' && Number.isFinite(Number(value))) return `span ${Number(value)} / span ${Number(value)}`
  return undefined
}

function isLayout(value: unknown): value is FormItemLayout {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
</script>

<template>
  <div v-if="visible" :style="wrapperStyle">
    <component
      :is="renderer"
      v-if="renderer"
      v-bind="rendererProps"
    />
    <UAlert
      v-else
      color="neutral"
      variant="soft"
      icon="i-lucide-construction"
      title="Unsupported field"
      :description="`The ${field.type.value} field renderer is not implemented in this slice.`"
    />
  </div>
</template>
