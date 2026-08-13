import type {
  TableQueryStateFilterRule,
  TableTextFilterDefinition,
  TableTextFilterOperator,
} from '../../../types'
import { resolveTextFilterUi } from '../ui'
import type { FilterPreviewResult } from './types'

export function buildTextFilterPreview(options: {
  definition: TableTextFilterDefinition
  rule: TableQueryStateFilterRule
}): FilterPreviewResult {
  const summary = Array.isArray(options.rule.value)
    ? `${options.rule.value.length} selected`
    : String(options.rule.value ?? '')
  const operator: TableTextFilterOperator =
    options.rule.operator === 'is' || options.rule.operator === 'isNot'
      ? options.rule.operator
      : 'contains'
  const preview = resolveTextFilterUi(options.definition, operator).preview
  const resolvedSummary = summary ? prefixPreviewLabel(preview.label, summary) : ''

  return {
    active: Boolean(resolvedSummary),
    count: resolvedSummary ? 1 : 0,
    tags: [],
    summary: resolvedSummary,
  }
}

function prefixPreviewLabel(label: string, value: string) {
  return label ? `${label}: ${value}` : value
}
