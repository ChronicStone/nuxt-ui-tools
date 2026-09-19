import { defineFormFieldKind } from '../../utils/field-kind'

export const checkboxFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'checkbox',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
