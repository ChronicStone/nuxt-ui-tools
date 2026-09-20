import { defineFormFieldKind } from '../../utils/field-kind'

export const cardFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'card',
  ui: { description: true, label: true },
})
