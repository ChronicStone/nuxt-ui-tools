import { defineFormFieldKind } from '../../utils/field-kind'

export const cascaderFieldKind = defineFormFieldKind({
  type: 'cascader',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  options: { enabled: true },
  validation: true,
  transform: true,
})
