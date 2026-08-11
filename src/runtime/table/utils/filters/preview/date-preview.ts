import type {
  TableDateFilterDefinition,
  TableDateFilterOperator,
  TableQueryStateFilterRule,
} from '../../../types'
import { formatFilterDate, getDateRangeValue, toDateFilterValue, toMaybeDate } from '../common'
import { resolveDateFilterUi } from '../ui'
import type { FilterPreviewResult } from './types'

export function buildDateFilterPreview(options: {
  definition: TableDateFilterDefinition
  rule: TableQueryStateFilterRule
}): FilterPreviewResult {
  const operator = resolveDateOperator(options.rule.operator)
  const filterUi = resolveDateFilterUi(options.definition, operator)
  const preview = operator === 'between' ? filterUi.range.preview : filterUi.scalar.preview
  const range = getDateRangeValue({ value: options.rule.value })

  if (range && (range.from || range.to)) {
    const start = toMaybeDate({ value: range.from })
    const end = toMaybeDate({ value: range.to })
    const summary = preview.rangeFormatter
      ? preview.rangeFormatter({ from: start, to: end })
      : [start, end]
          .filter((value): value is Date => value instanceof Date)
          .map((value) => formatFilterDate({ value }))
          .join(' - ')

    return {
      active: true,
      count: [start, end].filter(Boolean).length,
      tags: [],
      summary: prefixPreviewLabel(preview.label, summary),
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
    summary: date
      ? prefixPreviewLabel(
          preview.label,
          preview.formatter?.(date) ?? formatFilterDate({ value: date }),
        )
      : '',
  }
}

function resolveDateOperator(
  value: TableQueryStateFilterRule['operator'],
): TableDateFilterOperator {
  if (value === 'isNot' || value === 'before' || value === 'after' || value === 'between') {
    return value
  }

  return 'is'
}

function prefixPreviewLabel(label: string, value: string) {
  return label && value ? `${label}: ${value}` : value
}
