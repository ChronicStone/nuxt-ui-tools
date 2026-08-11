import { defineFormFieldKind } from '../../utils/field-kind'

export const numberFieldKind = defineFormFieldKind({
  type: 'number',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
