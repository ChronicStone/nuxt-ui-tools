import { defineFormFieldKind } from '../../utils/field-kind'

export const checkboxGroupFieldKind = defineFormFieldKind({
  type: 'checkbox-group',
  state: 'stateful',
  ui: { label: true, description: true, hint: true },
  layout: { item: true },
  options: { enabled: true },
  validation: true,
  transform: true,
})
