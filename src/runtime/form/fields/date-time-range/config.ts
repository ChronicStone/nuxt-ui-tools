import { defineFormFieldKind } from '../../utils/field-kind'

export const dateTimeRangeFieldKind = defineFormFieldKind({
  type: 'datetimerange',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
