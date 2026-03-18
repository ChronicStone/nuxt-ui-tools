import type { TableDateFilterDefinition, TableQueryStateFilterRule } from '../../../types'
import { formatFilterDate, getDateRangeValue, toDateFilterValue, toMaybeDate } from '../common'
import type { FilterPreviewResult } from './types'

export function buildDateFilterPreview(options: {
  definition: TableDateFilterDefinition
  rule: TableQueryStateFilterRule
}): FilterPreviewResult {
  const range = getDateRangeValue({ value: options.rule.value })

  if (range && (range.from || range.to)) {
    const start = toMaybeDate({ value: range.from })
    const end = toMaybeDate({ value: range.to })

    return {
      active: true,
      count: [start, end].filter(Boolean).length,
      tags: [],
      summary: [start, end]
        .filter((value): value is Date => value instanceof Date)
        .map((value) => formatFilterDate({ value }))
        .join(' - '),
    }
  }

  const date = toDateFilterValue({
    definition: options.definition,
    value: options.rule.value,
  })

  return {
    active: Boolean(date),
    count: date ? 1 : 0,
    tags: [],
    summary: date ? formatFilterDate({ value: date }) : '',
  }
}
