import { defineFormFieldKind } from '../../utils/field-kind'

export const uploadFieldKind = defineFormFieldKind({
  type: 'upload',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  upload: { enabled: true },
  validation: true,
  transform: true,
})

