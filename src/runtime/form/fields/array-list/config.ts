import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayListFieldKind = defineFormFieldKind({
  type: 'array-list',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
})

