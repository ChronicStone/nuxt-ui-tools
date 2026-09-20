import { defineFormFieldKind } from '../../utils/field-kind'

export const ratingFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'rating',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
