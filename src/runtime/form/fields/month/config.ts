import { defineFormFieldKind } from '../../utils/field-kind'

export const monthFieldKind = defineFormFieldKind({
  type: 'month',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
