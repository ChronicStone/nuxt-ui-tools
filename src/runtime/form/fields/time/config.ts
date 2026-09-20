import { defineFormFieldKind } from '../../utils/field-kind'

export const timeFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'time',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
