import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayCollapseFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'array-collapse',
  ui: { description: true, label: true },
})
