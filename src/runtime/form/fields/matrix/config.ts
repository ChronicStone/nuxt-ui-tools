import { defineFormFieldKind } from '../../utils/field-kind'

export const matrixFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'stateful',
  transform: true,
  type: 'matrix',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
