import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayVariantFieldKind = defineFormFieldKind({
  type: 'array-variant',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
})
