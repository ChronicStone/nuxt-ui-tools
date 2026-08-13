import { defineFormFieldKind } from '../../utils/field-kind'

export const arrayTabsFieldKind = defineFormFieldKind({
  type: 'array-tabs',
  state: 'passthrough',
  ui: { label: true, description: true },
  layout: { item: true, container: true },
})
