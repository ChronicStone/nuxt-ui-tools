import { defineFormFieldKind } from '../../utils/field-kind'

export const buttonFieldKind = defineFormFieldKind({
  type: 'button',
  state: 'stateless',
  layout: { item: true },
})
