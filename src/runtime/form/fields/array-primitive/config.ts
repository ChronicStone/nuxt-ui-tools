import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayPrimitiveFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'array-primitive',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
