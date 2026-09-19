import { defineFormFieldKind } from '../../utils/field-kind'

export const yearFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'year',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
