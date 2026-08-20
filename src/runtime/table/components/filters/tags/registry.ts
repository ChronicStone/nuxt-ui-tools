import type { Component } from 'vue'

import type { TableUiFilterDefinition } from '../../../types'
import BooleanFilterTag from './BooleanFilterTag.vue'
import DateFilterTag from './DateFilterTag.vue'
import NumberFilterTag from './NumberFilterTag.vue'
import OptionFilterTag from './OptionFilterTag.vue'
import TextFilterTag from './TextFilterTag.vue'

const FILTER_TAG_COMPONENTS = {
  option: OptionFilterTag,
  boolean: BooleanFilterTag,
  date: DateFilterTag,
  number: NumberFilterTag,
  text: TextFilterTag,
} satisfies Record<TableUiFilterDefinition['kind'], Component>

export function resolveFilterTagComponent(definition: TableUiFilterDefinition): Component {
  return FILTER_TAG_COMPONENTS[definition.kind]
}
