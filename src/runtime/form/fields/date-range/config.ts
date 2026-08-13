import { defineFormFieldKind } from '../../utils/field-kind'

export const dateRangeFieldKind = defineFormFieldKind({
  type: 'daterange',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
