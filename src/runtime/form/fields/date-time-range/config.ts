import { defineFormFieldKind } from '../../utils/field-kind'

export const dateTimeRangeFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'datetimerange',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
