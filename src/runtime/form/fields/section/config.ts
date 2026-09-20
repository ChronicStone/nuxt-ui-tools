import { defineFormFieldKind } from '../../utils/field-kind'

export const sectionFieldKind = defineFormFieldKind({
  layout: { item: true },
  state: 'stateless',
  type: 'section',
})
