import { defineFormFieldKind } from '../../utils/field-kind'

export const selectFieldKind = defineFormFieldKind({
  type: 'select',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  options: { enabled: true },
  validation: true,
  transform: true,
})

