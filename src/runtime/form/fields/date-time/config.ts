import { defineFormFieldKind } from '../../utils/field-kind'

export const dateTimeFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'datetime',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
