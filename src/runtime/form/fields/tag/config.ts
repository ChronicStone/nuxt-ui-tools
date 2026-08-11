import { defineFormFieldKind } from '../../utils/field-kind'

export const tagFieldKind = defineFormFieldKind({
  type: 'tag',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
