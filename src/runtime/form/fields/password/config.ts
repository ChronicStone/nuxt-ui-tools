import { defineFormFieldKind } from '../../utils/field-kind'

export const passwordFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'password',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
