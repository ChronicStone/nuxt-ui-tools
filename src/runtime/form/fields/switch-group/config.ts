import { defineFormFieldKind } from '../../utils/field-kind'

export const switchGroupFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'switch-group',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
