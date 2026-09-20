import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayListFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'array-list',
  ui: { description: true, label: true },
})
