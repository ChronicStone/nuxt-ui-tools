import { defineFormFieldKind } from '../../utils/field-kind'

export const monthRangeFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'monthrange',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
