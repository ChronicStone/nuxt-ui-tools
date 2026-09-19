import { defineFormFieldKind } from '../../utils/field-kind'

export const fileFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'file',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
