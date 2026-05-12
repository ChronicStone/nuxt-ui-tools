import { defineFormFieldKind } from '../../utils/field-kind'

export const dateFieldKind = defineFormFieldKind({
  type: 'date',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
