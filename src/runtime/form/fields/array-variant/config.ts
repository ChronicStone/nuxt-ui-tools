import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayVariantFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'array-variant',
  ui: { description: true, label: true },
})
