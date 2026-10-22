import { defineFormFieldKind } from '../../utils/field-kind'

export const infoFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateless',
  type: 'info',
  ui: { description: true, hint: true, label: true },
})
