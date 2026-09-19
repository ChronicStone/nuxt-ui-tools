import { defineFormFieldKind } from '../../utils/field-kind'

export const cascaderFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'cascader',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
