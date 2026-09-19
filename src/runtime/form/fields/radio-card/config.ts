import { defineFormFieldKind } from '../../utils/field-kind'

export const radioCardFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'radio-card',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
