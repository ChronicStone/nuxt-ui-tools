import { defineFormFieldKind } from '../../utils/field-kind'

export const columnFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'column',
})
