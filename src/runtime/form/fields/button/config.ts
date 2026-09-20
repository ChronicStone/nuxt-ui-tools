import { defineFormFieldKind } from '../../utils/field-kind'

export const buttonFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateless',
  type: 'button',
})
