import { defineFormFieldKind } from '../../utils/field-kind'

export const tabsFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'tabs',
})
