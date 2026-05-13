import { defineFormFieldKind } from '../../utils/field-kind'

export const oneTimeCodeFieldKind = defineFormFieldKind({
  type: 'one-time-code',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
