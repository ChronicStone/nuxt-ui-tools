import type { TableFilterOperator } from '../../types'

const FILTER_OPERATOR_LABELS: Record<TableFilterOperator, string> = {
  contains: 'contains',
  is: 'is',
  isAnyOf: 'is any of',
  isNot: 'is not',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
  between: 'between',
  before: 'before',
  after: 'after',
}

export function getFilterOperatorLabel(options: {
  operator?: TableFilterOperator
}) {
  if (!options.operator) {
    return 'is'
  }

  return FILTER_OPERATOR_LABELS[options.operator] ?? options.operator
}
