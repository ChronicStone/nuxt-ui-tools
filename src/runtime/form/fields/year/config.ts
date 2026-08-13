import { defineFormFieldKind } from '../../utils/field-kind'

export const yearFieldKind = defineFormFieldKind({
  type: 'year',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
