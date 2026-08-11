import { defineFormFieldKind } from '../../utils/field-kind'

export const columnFieldKind = defineFormFieldKind({
  type: 'column',
  state: 'passthrough',
  layout: { item: true, container: true },
})
