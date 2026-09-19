import { defineFormFieldKind } from '../../utils/field-kind'

export const phoneNumberFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'phone-number',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
