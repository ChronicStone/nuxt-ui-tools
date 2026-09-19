import { defineFormFieldKind } from '../../utils/field-kind'

export const sliderFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'slider',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
