import { defineFormFieldKind } from '../../utils/field-kind'

export const treeSelectFieldKind = defineFormFieldKind({
  type: 'tree-select',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  options: { enabled: true },
  validation: true,
  transform: true,
})
