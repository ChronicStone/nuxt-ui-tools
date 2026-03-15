import type { TableQueryStateFilterRule } from '../../../types'
import { formatFilterNumber, getNumberRangeValue, toMaybeNumber } from '../common'
import type { FilterPreviewResult } from './types'

export function buildNumberFilterPreview(options: {
  rule: TableQueryStateFilterRule
}): FilterPreviewResult {
  const range = getNumberRangeValue({ value: options.rule.value })

  if (range && (range.from != null || range.to != null)) {
    const start = toMaybeNumber({ value: range.from })
    const end = toMaybeNumber({ value: range.to })

    return {
      active: true,
      count: [start, end].filter((v) => v != null).length,
      tags: [],
      summary: [start, end]
        .filter((v): v is number => v != null)
        .map((value) => formatFilterNumber({ value }))
        .join(' - '),
    }
  }

  const num = toMaybeNumber({ value: options.rule.value })
  const summary = num != null ? formatFilterNumber({ value: num }) : ''

  return {
    active: Boolean(summary),
    count: summary ? 1 : 0,
    tags: [],
    summary,
  }
}
