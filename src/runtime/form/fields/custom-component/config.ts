import { defineFormFieldKind } from '../../utils/field-kind'

export const customComponentFieldKind = defineFormFieldKind({
  type: 'custom-component',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
