import { defineFormFieldKind } from '../../utils/field-kind'

export const checkboxFieldKind = defineFormFieldKind({
  type: 'checkbox',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
