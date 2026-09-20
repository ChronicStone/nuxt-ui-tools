import { defineFormFieldKind } from '../../utils/field-kind'

export const groupFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'group',
  ui: { description: true, label: true },
})
