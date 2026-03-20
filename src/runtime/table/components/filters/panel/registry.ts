import type { Component } from 'vue'

import type { TableUiFilterDefinition } from '../../../types'
import BooleanFilterPanelField from './BooleanFilterPanelField.vue'
import DateFilterPanelField from './DateFilterPanelField.vue'
import NumberFilterPanelField from './NumberFilterPanelField.vue'
import OptionFilterPanelField from './OptionFilterPanelField.vue'
import TextFilterPanelField from './TextFilterPanelField.vue'

const FILTER_PANEL_COMPONENTS: Record<TableUiFilterDefinition['kind'], Component> = {
  option: OptionFilterPanelField,
  boolean: BooleanFilterPanelField,
  date: DateFilterPanelField,
  number: NumberFilterPanelField,
  text: TextFilterPanelField,
}

export function resolveFilterPanelComponent(definition: TableUiFilterDefinition): Component {
  return FILTER_PANEL_COMPONENTS[definition.kind]
}
