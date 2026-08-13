import { defineFormFieldKind } from '../../utils/field-kind'

export const ratingFieldKind = defineFormFieldKind({
  type: 'rating',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})
