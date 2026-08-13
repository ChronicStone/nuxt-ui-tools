import { defineFormFieldKind } from '../../utils/field-kind'

export const cardFieldKind = defineFormFieldKind({
  type: 'card',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
})
