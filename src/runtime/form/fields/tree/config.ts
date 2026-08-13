import { defineFormFieldKind } from '../../utils/field-kind'

export const treeFieldKind = defineFormFieldKind({
  type: 'tree',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  options: { enabled: true },
  validation: true,
  transform: true,
})
