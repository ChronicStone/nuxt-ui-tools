import { defineFormFieldKind } from '../../utils/field-kind'

export const switchFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'switch',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
