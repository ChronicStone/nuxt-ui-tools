import { defineFormFieldKind } from '../../utils/field-kind'

export const textFieldKind = defineFormFieldKind({
  type: 'text',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})

