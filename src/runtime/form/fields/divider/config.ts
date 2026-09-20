import { defineFormFieldKind } from '../../utils/field-kind'

export const dividerFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateless',
  type: 'divider',
})
