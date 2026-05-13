import { defineFormFieldKind } from '../../utils/field-kind'

export const colorPickerFieldKind = defineFormFieldKind({
  type: 'color-picker',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
