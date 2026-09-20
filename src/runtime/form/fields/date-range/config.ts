import { defineFormFieldKind } from '../../utils/field-kind'

export const dateRangeFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'daterange',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
