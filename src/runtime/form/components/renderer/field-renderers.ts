import type { Component } from 'vue'

import ArrayCollapseField from '../../fields/array-collapse/component.vue'
import ArrayListField from '../../fields/array-list/component.vue'
import ArrayPrimitiveField from '../../fields/array-primitive/component.vue'
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
import SectionField from '../../fields/section/component.vue'
import SelectField from '../../fields/select/component.vue'
import SliderField from '../../fields/slider/component.vue'
import SwitchGroupField from '../../fields/switch-group/component.vue'
import SwitchField from '../../fields/switch/component.vue'
import TabsField from '../../fields/tabs/component.vue'
import TagField from '../../fields/tag/component.vue'
import TextField from '../../fields/text/component.vue'
import TextareaField from '../../fields/textarea/component.vue'
import TimeField from '../../fields/time/component.vue'
import UploadField from '../../fields/upload/component.vue'
import type { FormFieldType } from '../../types'

let renderers: Map<FormFieldType, Component> | undefined

/**
 * Renderer of a field type. The map is built on first use, once for every field instance, and not
 * at module evaluation, where field components that render nested fields are still initializing.
 */
export function fieldRenderer(type: FormFieldType) {
  renderers ??= new Map<FormFieldType, Component>([
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
    ['section', SectionField],
    ['input-group', InputGroupField],
    ['tabs', TabsField],
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
    ['array-collapse', ArrayCollapseField],
    ['array-primitive', ArrayPrimitiveField],
    ['slider', SliderField],
    ['color-picker', ColorPickerField],
    ['one-time-code', OneTimeCodeField],
    ['rating', RatingField],
    ['tag', TagField],
    ['button', ButtonField],
    ['card', CardField],
    ['column', ColumnField],
  ])
  return renderers.get(type)
}
