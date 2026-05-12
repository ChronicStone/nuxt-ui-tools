import { defineFormFieldKind } from '../../utils/field-kind'

export const sliderFieldKind = defineFormFieldKind({
  type: 'slider',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})

