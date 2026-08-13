import { defineFormFieldKind } from '../../utils/field-kind'

export const infoFieldKind = defineFormFieldKind({
  type: 'info',
  state: 'stateless',
  layout: { item: true },
})
