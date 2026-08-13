import { defineFormFieldKind } from '../../utils/field-kind'

export const groupFieldKind = defineFormFieldKind({
  type: 'group',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
})
