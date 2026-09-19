import { defineFormFieldKind } from '../../utils/field-kind'

export const textFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'text',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
