import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayTableFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'array-table',
  ui: { description: true, label: true },
})
