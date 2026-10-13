import { defineFormFieldKind } from '../../utils/field-kind'

export const selectFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true, groups: true },
  state: 'stateful',
  transform: true,
  type: 'select',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
