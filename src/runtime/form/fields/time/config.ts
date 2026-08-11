import { defineFormFieldKind } from '../../utils/field-kind'

export const timeFieldKind = defineFormFieldKind({
  type: 'time',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
