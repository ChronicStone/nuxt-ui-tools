import type { Component } from 'vue'

import type { TableUiFilterDefinition } from '../../../types'
import BooleanFilterPanelField from './BooleanFilterPanelField.vue'
import DateFilterPanelField from './DateFilterPanelField.vue'
import NumberFilterPanelField from './NumberFilterPanelField.vue'
import OptionFilterPanelField from './OptionFilterPanelField.vue'
import TextFilterPanelField from './TextFilterPanelField.vue'

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
