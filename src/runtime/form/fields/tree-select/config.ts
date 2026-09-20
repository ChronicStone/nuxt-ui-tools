import { defineFormFieldKind } from '../../utils/field-kind'

export const treeSelectFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'tree-select',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
