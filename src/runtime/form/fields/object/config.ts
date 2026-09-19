import { defineFormFieldKind } from '../../utils/field-kind'

export const objectFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  transform: true,
  type: 'object',
  ui: { description: true, label: true },
})
