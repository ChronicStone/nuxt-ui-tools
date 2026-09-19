import { defineFormFieldKind } from '../../utils/field-kind'

export const dateFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'date',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
