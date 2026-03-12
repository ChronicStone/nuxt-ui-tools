import type { TableFilterOperator, TableQueryStateFilterKind } from '../types/query-state'

export const DEFAULT_FILTER_OPERATOR: Record<TableQueryStateFilterKind, TableFilterOperator> = {
  text: 'contains',
  option: 'isAnyOf',
  boolean: 'is',
  number: 'is',
  date: 'is',
}

export const PAGINATION_DEFAULTS = {
  defaultSize: { grid: 10, table: 50 },
  sizes: {
    grid: [10, 20, 50, 100],
    table: [10, 20, 50, 100, 200, 500],
  },
}
