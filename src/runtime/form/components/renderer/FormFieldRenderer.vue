<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { Component } from 'vue'

import UAlert from '@nuxt/ui/components/Alert.vue'

import type { FormField, FormFieldType, FormItemLayout } from '../../types'
import { childParentPath, fieldPath, useFormRuntimeContext } from '../../composables/use-form-runtime'
import { focusFormFieldElement } from '../../utils/focus'
import { createFormFieldInstance } from '../../utils/field-instance'
import { useFormItemLayout } from '../../composables/use-form-layout'
import ArrayListField from '../../fields/array-list/component.vue'
import ButtonField from '../../fields/button/component.vue'
import CheckboxGroupField from '../../fields/checkbox-group/component.vue'
import CheckboxField from '../../fields/checkbox/component.vue'
import ColorPickerField from '../../fields/color-picker/component.vue'
import CustomComponentField from '../../fields/custom-component/component.vue'
import DateField from '../../fields/date/component.vue'
import DividerField from '../../fields/divider/component.vue'
import FileField from '../../fields/file/component.vue'
import HiddenField from '../../fields/hidden/component.vue'
import InfoField from '../../fields/info/component.vue'
import InputGroupField from '../../fields/input-group/component.vue'
import NumberField from '../../fields/number/component.vue'
import OneTimeCodeField from '../../fields/one-time-code/component.vue'
import ObjectField from '../../fields/object/component.vue'
import PasswordField from '../../fields/password/component.vue'
import PhoneNumberField from '../../fields/phone-number/component.vue'
import RadioField from '../../fields/radio/component.vue'
import SelectField from '../../fields/select/component.vue'
import SliderField from '../../fields/slider/component.vue'
import SwitchField from '../../fields/switch/component.vue'
import TagField from '../../fields/tag/component.vue'
import TextField from '../../fields/text/component.vue'
import TextareaField from '../../fields/textarea/component.vue'
import UploadField from '../../fields/upload/component.vue'

const props = defineProps<{
  field: FormField
  parentPath: readonly string[]
}>()

const form = useFormRuntimeContext()
const element = ref<HTMLElement | null>(null)
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
const itemLayout = useFormItemLayout({
  layout: resolveFieldLayout,
  formLayout: form.currentLayout,
})

watchEffect((onCleanup) => {
  if (!element.value) return
  onCleanup(form.registerFieldElement(path.value, element.value))
})

watchEffect(async () => {
  const request = form.focusRequest.value
  if (!request || request.path !== path.value.join('.') || !element.value) return

  await focusFormFieldElement(element.value)
})

const fieldRenderers = new Map<FormFieldType, Component>([
  ['text', TextField],
  ['password', PasswordField],
  ['textarea', TextareaField],
  ['number', NumberField],
  ['checkbox', CheckboxField],
  ['switch', SwitchField],
  ['select', SelectField],
  ['checkbox-group', CheckboxGroupField],
  ['radio', RadioField],
  ['date', DateField],
  ['phone-number', PhoneNumberField],
  ['hidden', HiddenField],
  ['info', InfoField],
  ['divider', DividerField],
  ['input-group', InputGroupField],
  ['object', ObjectField],
  ['custom-component', CustomComponentField],
  ['file', FileField],
  ['upload', UploadField],
  ['array-list', ArrayListField],
  ['array-tabs', ArrayListField],
  ['array-variant', ArrayListField],
  ['slider', SliderField],
  ['color-picker', ColorPickerField],
  ['one-time-code', OneTimeCodeField],
  ['tag', TagField],
  ['button', ButtonField],
])

function resolveFieldLayout(): FormItemLayout | undefined {
  if (!field.value.capability.has('itemLayout')) return undefined
  const layout = Object.getOwnPropertyDescriptor(props.field, 'layout')?.value
  return isLayout(layout) ? layout : undefined
}

function isLayout(value: unknown): value is FormItemLayout {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
</script>

<template>
  <div
    v-if="visible"
    ref="element"
    :data-form-field="path.join('.')"
    :style="itemLayout.style.value"
  >
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
