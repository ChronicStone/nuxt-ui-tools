import { defineFormFieldKind } from '../../utils/field-kind'

export const phoneNumberFieldKind = defineFormFieldKind({
  type: 'phone-number',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
