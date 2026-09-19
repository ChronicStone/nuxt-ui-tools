import { defineFormFieldKind } from '../../utils/field-kind'

export const inputGroupFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'input-group',
  ui: { description: true, label: true },
})
