import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayTabsFieldKind = defineFormFieldKind({
  layout: { container: true, item: true },
  state: 'passthrough',
  type: 'array-tabs',
  ui: { description: true, label: true },
})
