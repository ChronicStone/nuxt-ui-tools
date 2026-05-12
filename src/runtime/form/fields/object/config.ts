import { defineFormFieldKind } from '../../utils/field-kind'

export const objectFieldKind = defineFormFieldKind({
  type: 'object',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
  transform: true,
})

