import { defineFormFieldKind } from '../../utils/field-kind'

export const uploadFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'upload',
  ui: { description: true, hint: true, label: true },
  upload: { enabled: true },
  validation: true,
})
