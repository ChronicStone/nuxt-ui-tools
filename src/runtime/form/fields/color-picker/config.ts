import { defineFormFieldKind } from '../../utils/field-kind'

export const colorPickerFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'color-picker',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
