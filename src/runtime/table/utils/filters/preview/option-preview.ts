import type { TableUiFilterDefinition, TableQueryStateFilterRule } from '../../../types'
import type { FilterPreviewOptionEntry, FilterPreviewResult } from './types'

export function buildOptionFilterPreview(options: {
  definition: TableUiFilterDefinition
  rule: TableQueryStateFilterRule
  optionEntries: FilterPreviewOptionEntry[]
}): FilterPreviewResult {
  const values = Array.isArray(options.rule.value) ? options.rule.value : [options.rule.value]
  const labels = values.map((value) =>
    resolveOptionPreviewLabel({
      definition: options.definition,
      optionEntries: options.optionEntries,
      value,
    }),
  )

  const MAX_TAGS = 1
  const visibleTags = labels.slice(0, MAX_TAGS)
  const overflow = labels.length - visibleTags.length

  return {
    active: true,
    count: labels.length,
    tags: visibleTags,
    summary: overflow > 0 ? `+${overflow}` : '',
  }
}

function resolveOptionPreviewLabel(options: {
  definition: TableUiFilterDefinition
  optionEntries: FilterPreviewOptionEntry[]
  value: unknown
}) {
  const matched = options.optionEntries.find(
    (entry) => String(entry.value) === String(options.value),
  )

  if (matched) {
    return matched.label
  }

  if (options.definition.kind === 'boolean') {
    return options.value ? 'Yes' : 'No'
  }

  return String(options.value ?? '')
}
