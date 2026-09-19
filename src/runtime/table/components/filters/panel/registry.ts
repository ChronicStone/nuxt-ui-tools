import type { Component } from 'vue'

import type { TableUiFilterDefinition } from '../../../types'
import BooleanFilterPanelField from './boolean-filter-panel-field.vue'
import DateFilterPanelField from './date-filter-panel-field.vue'
import NumberFilterPanelField from './number-filter-panel-field.vue'
import OptionFilterPanelField from './option-filter-panel-field.vue'
import TextFilterPanelField from './text-filter-panel-field.vue'

const FILTER_PANEL_COMPONENTS = {
  boolean: BooleanFilterPanelField,
  date: DateFilterPanelField,
  number: NumberFilterPanelField,
  option: OptionFilterPanelField,
  text: TextFilterPanelField,
} satisfies Record<TableUiFilterDefinition['kind'], Component>

export function resolveFilterPanelComponent(definition: TableUiFilterDefinition): Component {
  return FILTER_PANEL_COMPONENTS[definition.kind]
}
