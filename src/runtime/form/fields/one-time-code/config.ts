import { defineFormFieldKind } from '../../utils/field-kind'

export const oneTimeCodeFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'one-time-code',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
