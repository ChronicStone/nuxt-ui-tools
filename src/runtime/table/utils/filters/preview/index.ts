import type { TableQueryStateFilterRule, TableUiFilterDefinition } from '../../../types'
import { buildDateFilterPreview } from './date-preview'
import { buildNumberFilterPreview } from './number-preview'
import { buildOptionFilterPreview } from './option-preview'
import { buildTextFilterPreview } from './text-preview'
import type { FilterPreviewOptionEntry, FilterPreviewResult } from './types'

export type { FilterPreviewResult, FilterPreviewOptionEntry }

const EMPTY_PREVIEW: FilterPreviewResult = {
  active: false,
  count: 0,
  tags: [],
  summary: '',
}

export function buildFilterPreview(options: {
  definition: TableUiFilterDefinition
  rule?: TableQueryStateFilterRule
  optionEntries?: FilterPreviewOptionEntry[]
}): FilterPreviewResult {
  if (!options.rule) {
    return EMPTY_PREVIEW
  }

  if (options.definition.kind === 'option' || options.definition.kind === 'boolean') {
    return buildOptionFilterPreview({
      definition: options.definition,
      rule: options.rule,
      optionEntries: options.optionEntries ?? [],
    })
  }

  if (options.definition.kind === 'date') {
    return buildDateFilterPreview({
      definition: options.definition,
      rule: options.rule,
    })
  }

  if (options.definition.kind === 'number') {
    return buildNumberFilterPreview({
      definition: options.definition,
      rule: options.rule,
    })
  }

  return buildTextFilterPreview({
    definition: options.definition,
    rule: options.rule,
  })
}
