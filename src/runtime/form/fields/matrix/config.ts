import { defineFormFieldKind } from '../../utils/field-kind'

export const matrixFieldKind = defineFormFieldKind({
  type: 'matrix',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true, container: true },
  validation: true,
  transform: true,
})
