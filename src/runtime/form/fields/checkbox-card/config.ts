import { defineFormFieldKind } from '../../utils/field-kind'

export const checkboxCardFieldKind = defineFormFieldKind({
  type: 'checkbox-card',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  options: { enabled: true },
  validation: true,
  transform: true,
})
