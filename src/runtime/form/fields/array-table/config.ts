import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayTableFieldKind = defineFormFieldKind({
  type: 'array-table',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
})
