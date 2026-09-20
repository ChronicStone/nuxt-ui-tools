import type { Component } from 'vue'

import type { TableUiFilterDefinition } from '../../../types'
import BooleanFilterTag from './boolean-filter-tag.vue'
import DateFilterTag from './date-filter-tag.vue'
import NumberFilterTag from './number-filter-tag.vue'
import OptionFilterTag from './option-filter-tag.vue'
import TextFilterTag from './text-filter-tag.vue'

const FILTER_TAG_COMPONENTS = {
  boolean: BooleanFilterTag,
  date: DateFilterTag,
  number: NumberFilterTag,
  option: OptionFilterTag,
  text: TextFilterTag,
} satisfies Record<TableUiFilterDefinition['kind'], Component>

export function resolveFilterTagComponent(definition: TableUiFilterDefinition): Component {
  return FILTER_TAG_COMPONENTS[definition.kind]
}
