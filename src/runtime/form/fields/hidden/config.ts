import { defineFormFieldKind } from '../../utils/field-kind'

export const hiddenFieldKind = defineFormFieldKind({
  type: 'hidden',
  state: 'stateful',
  validation: true,
  transform: true,
})
