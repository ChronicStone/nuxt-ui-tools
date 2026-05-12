import { defineFormFieldKind } from '../../utils/field-kind'

export const textareaFieldKind = defineFormFieldKind({
  type: 'textarea',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  validation: true,
  transform: true,
})

