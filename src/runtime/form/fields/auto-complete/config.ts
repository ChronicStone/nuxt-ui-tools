import { defineFormFieldKind } from '../../utils/field-kind'

export const autoCompleteFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'auto-complete',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
