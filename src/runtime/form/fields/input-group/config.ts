import { defineFormFieldKind } from '../../utils/field-kind'

export const inputGroupFieldKind = defineFormFieldKind({
  type: 'input-group',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
})
