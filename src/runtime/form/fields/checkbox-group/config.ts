import { defineFormFieldKind } from '../../utils/field-kind'

export const checkboxGroupFieldKind = defineFormFieldKind({
  layout: { item: true },
  options: { enabled: true },
  state: 'stateful',
  transform: true,
  type: 'checkbox-group',
  ui: { description: true, hint: true, label: true },
  validation: true,
})
