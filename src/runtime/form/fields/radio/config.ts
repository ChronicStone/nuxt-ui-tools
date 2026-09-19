import { defineFormFieldKind } from '../../utils/field-kind'

export const radioFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'radio',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
