import { defineFormFieldKind } from '../../utils/field-kind'

export const treeFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'tree',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
