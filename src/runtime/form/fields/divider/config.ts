import { defineFormFieldKind } from '../../utils/field-kind'

export const dividerFieldKind = defineFormFieldKind({
  type: 'divider',
  state: 'stateless',
  layout: { item: true },
})
