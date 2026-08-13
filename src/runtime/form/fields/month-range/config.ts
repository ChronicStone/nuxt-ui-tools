import { defineFormFieldKind } from '../../utils/field-kind'

export const monthRangeFieldKind = defineFormFieldKind({
  type: 'monthrange',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
