import { defineFormFieldKind } from '../../utils/field-kind'

export const customComponentFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'custom-component',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
