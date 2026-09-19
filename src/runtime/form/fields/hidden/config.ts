import { defineFormFieldKind } from '../../utils/field-kind'

export const hiddenFieldKind = defineFormFieldKind({
  state: 'stateful',
  transform: true,
  type: 'hidden',
  validation: true,
})
