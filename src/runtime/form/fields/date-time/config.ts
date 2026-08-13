import { defineFormFieldKind } from '../../utils/field-kind'

export const dateTimeFieldKind = defineFormFieldKind({
  type: 'datetime',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
