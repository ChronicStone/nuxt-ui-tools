import { defineFormFieldKind } from '../../utils/field-kind'

export const tagFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'tag',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
