import { defineFormFieldKind } from '../../utils/field-kind'

export const numberFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'number',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
