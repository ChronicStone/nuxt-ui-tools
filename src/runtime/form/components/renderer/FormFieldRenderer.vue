<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import { computed, ref, useId, watchEffect } from 'vue'
import type { Component } from 'vue'

import {
  provideFormFieldBare,
  provideFormFieldControlAttrs,
} from '../../composables/use-form-field-chrome'
import { useFormItemLayout } from '../../composables/use-form-layout'
import {
  childParentPath,
  fieldPath,
  useFormRuntimeContext,
} from '../../composables/use-form-runtime'
import ArrayListField from '../../fields/array-list/component.vue'
import ArrayTableField from '../../fields/array-table/component.vue'
import AutoCompleteField from '../../fields/auto-complete/component.vue'
import ButtonField from '../../fields/button/component.vue'
import CardField from '../../fields/card/component.vue'
import CheckboxCardField from '../../fields/checkbox-card/component.vue'
import CheckboxGroupField from '../../fields/checkbox-group/component.vue'
import CheckboxField from '../../fields/checkbox/component.vue'
import ColorPickerField from '../../fields/color-picker/component.vue'
import ColumnField from '../../fields/column/component.vue'
import CustomComponentField from '../../fields/custom-component/component.vue'
import DateFamilyField from '../../fields/date-family/component.vue'
import DateField from '../../fields/date/component.vue'
import DividerField from '../../fields/divider/component.vue'
import FileField from '../../fields/file/component.vue'
import GroupField from '../../fields/group/component.vue'
import HiddenField from '../../fields/hidden/component.vue'
import HierarchyField from '../../fields/hierarchy/component.vue'
import InfoField from '../../fields/info/component.vue'
import InputGroupField from '../../fields/input-group/component.vue'
import MatrixField from '../../fields/matrix/component.vue'
import NumberField from '../../fields/number/component.vue'
import ObjectField from '../../fields/object/component.vue'
import OneTimeCodeField from '../../fields/one-time-code/component.vue'
import PasswordField from '../../fields/password/component.vue'
import PhoneNumberField from '../../fields/phone-number/component.vue'
import RadioCardField from '../../fields/radio-card/component.vue'
import RadioField from '../../fields/radio/component.vue'
import RatingField from '../../fields/rating/component.vue'
import SelectField from '../../fields/select/component.vue'
import SliderField from '../../fields/slider/component.vue'
import SwitchGroupField from '../../fields/switch-group/component.vue'
import SwitchField from '../../fields/switch/component.vue'
import TagField from '../../fields/tag/component.vue'
import TextField from '../../fields/text/component.vue'
import TextareaField from '../../fields/textarea/component.vue'
import TimeField from '../../fields/time/component.vue'
import UploadField from '../../fields/upload/component.vue'
import type { FormField, FormFieldType, FormItemLayout, FormObject } from '../../types'
import { createFormFieldInstance } from '../../utils/field-instance'
import { focusFormFieldElement } from '../../utils/focus'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormField
  parentPath: readonly string[]
  bare?: boolean
  controlLabelledby?: string
}>()

const form = useFormRuntimeContext()
const element = ref<HTMLElement | null>(null)
const bare = computed<boolean>(() => props.bare === true)
const controlId = useId()
const controlAttrs = computed<FormObject>(() => {
  if (!bare.value) return {}
  if (props.controlLabelledby) return { id: controlId, 'aria-labelledby': props.controlLabelledby }
  return { id: controlId, 'aria-label': resolveControlLabel(props.field) }
})

provideFormFieldBare(bare)
provideFormFieldControlAttrs(controlAttrs)
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
  if (!field.value.type.isAny(['input-group', 'group', 'object', 'card', 'column']))
    return baseProps

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
  ['auto-complete', AutoCompleteField],
  ['checkbox', CheckboxField],
  ['switch', SwitchField],
  ['switch-group', SwitchGroupField],
  ['select', SelectField],
  ['checkbox-group', CheckboxGroupField],
  ['checkbox-card', CheckboxCardField],
  ['radio', RadioField],
  ['radio-card', RadioCardField],
  ['date', DateField],
  ['datetime', DateFamilyField],
  ['daterange', DateFamilyField],
  ['monthrange', DateFamilyField],
  ['datetimerange', DateFamilyField],
  ['month', DateFamilyField],
  ['year', DateFamilyField],
  ['time', TimeField],
  ['tree-select', HierarchyField],
  ['cascader', HierarchyField],
  ['tree', HierarchyField],
  ['phone-number', PhoneNumberField],
  ['hidden', HiddenField],
  ['info', InfoField],
  ['divider', DividerField],
  ['input-group', InputGroupField],
  ['group', GroupField],
  ['object', ObjectField],
  ['matrix', MatrixField],
  ['custom-component', CustomComponentField],
  ['file', FileField],
  ['upload', UploadField],
  ['array-list', ArrayListField],
  ['array-table', ArrayTableField],
  ['array-tabs', ArrayListField],
  ['array-variant', ArrayListField],
  ['slider', SliderField],
  ['color-picker', ColorPickerField],
  ['one-time-code', OneTimeCodeField],
  ['rating', RatingField],
  ['tag', TagField],
  ['button', ButtonField],
  ['card', CardField],
  ['column', ColumnField],
])

function resolveFieldLayout(): FormItemLayout | undefined {
  if (!field.value.capability.has('itemLayout')) return undefined
  const layout = Object.getOwnPropertyDescriptor(props.field, 'layout')?.value
  return isLayout(layout) ? layout : undefined
}

function isLayout(value: unknown): value is FormItemLayout {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveControlLabel(controlField: FormField) {
  if ('label' in controlField) return resolveFormText(controlField.label) ?? controlField.key
  return controlField.key
}
</script>

<template>
  <div
    v-if="visible"
    ref="element"
    :data-form-field="path.join('.')"
    :style="bare ? { display: 'contents' } : itemLayout.style.value"
  >
    <component :is="renderer" v-if="renderer" v-bind="rendererProps" />
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
