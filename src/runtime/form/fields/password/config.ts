import { defineFormFieldKind } from '../../utils/field-kind'

export const passwordFieldKind = defineFormFieldKind({
  type: 'password',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})

