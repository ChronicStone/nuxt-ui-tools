import { defineFormFieldKind } from '../../utils/field-kind'

export const checkboxCardFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'checkbox-card',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
