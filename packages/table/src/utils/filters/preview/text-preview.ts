import type { TableQueryStateFilterRule } from '../../../types'
import type { FilterPreviewResult } from './types'

export function buildTextFilterPreview(options: {
  rule: TableQueryStateFilterRule
}): FilterPreviewResult {
  const summary = Array.isArray(options.rule.value)
    ? `${options.rule.value.length} selected`
    : String(options.rule.value ?? '')

  return {
    active: Boolean(summary),
    count: summary ? 1 : 0,
    tags: [],
    summary,
  }
}
