import { defineFormFieldKind } from '../../utils/field-kind'

export const textareaFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateful',
  transform: true,
  type: 'textarea',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
