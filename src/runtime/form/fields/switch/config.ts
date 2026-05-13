import { defineFormFieldKind } from '../../utils/field-kind'

export const switchFieldKind = defineFormFieldKind({
  type: 'switch',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
