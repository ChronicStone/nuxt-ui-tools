import type {
  TableNumberFilterDefinition,
  TableNumberFilterOperator,
  TableQueryStateFilterRule,
} from '../../../types'
import { formatFilterNumber, getNumberRangeValue, toMaybeNumber } from '../common'
import { resolveNumberFilterUi } from '../ui'
import type { FilterPreviewResult } from './types'

export function buildNumberFilterPreview(options: {
  definition: TableNumberFilterDefinition
  rule: TableQueryStateFilterRule
}): FilterPreviewResult {
  const operator = resolveNumberOperator(options.rule.operator)
  const filterUi = resolveNumberFilterUi(options.definition, operator)
  const preview = operator === 'between' ? filterUi.range.preview : filterUi.scalar.preview
  const range = getNumberRangeValue({ value: options.rule.value })

  if (range && (range.from != null || range.to != null)) {
    const start = toMaybeNumber({ value: range.from })
    const end = toMaybeNumber({ value: range.to })
    const summary = preview.rangeFormatter
      ? preview.rangeFormatter({ from: start ?? undefined, to: end ?? undefined })
      : [start, end]
          .filter((value): value is number => value != null)
          .map((value) => formatFilterNumber({ value }))
          .join(' - ')

    return {
      active: true,
      count: [start, end].filter((v) => v != null).length,
      tags: [],
      summary: prefixPreviewLabel(preview.label, summary),
    }
  }

  const num = toMaybeNumber({ value: options.rule.value })
  const summary =
    num != null ? (preview.formatter?.(num) ?? formatFilterNumber({ value: num })) : ''

  return {
    active: Boolean(summary),
    count: summary ? 1 : 0,
    tags: [],
    summary: prefixPreviewLabel(preview.label, summary),
  }
}

function resolveNumberOperator(
  value: TableQueryStateFilterRule['operator'],
): TableNumberFilterOperator {
  if (
    value === 'isNot' ||
    value === 'gt' ||
    value === 'gte' ||
    value === 'lt' ||
    value === 'lte' ||
    value === 'between'
  )
    return value

  return 'is'
}

function prefixPreviewLabel(label: string, value: string) {
  return label && value ? `${label}: ${value}` : value
}
