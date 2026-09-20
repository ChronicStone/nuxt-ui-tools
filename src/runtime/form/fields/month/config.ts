import { defineFormFieldKind } from '../../utils/field-kind'

export const monthFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'month',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
