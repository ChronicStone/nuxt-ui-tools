import type { TableFilterOperator, TableQueryStateFilterKind } from '../types/query-state'

export const DEFAULT_FILTER_OPERATOR = {
  text: 'contains',
  option: 'isAnyOf',
  boolean: 'is',
  number: 'is',
  date: 'is',
} satisfies Record<TableQueryStateFilterKind, TableFilterOperator>

export const PAGINATION_DEFAULTS = {
  defaultSize: { grid: 10, table: 50 },
  sizes: {
    grid: [10, 20, 50, 100],
    table: [10, 20, 50, 100, 200, 500],
  },
}

/** Default TanStack Query options applied to all table queries. */
export const QUERY_DEFAULTS = {
  /** How long fetched data is considered fresh (ms). Prevents refetches on remount/focus. */
  staleTime: {
    /** Main data query */
    data: 30_000,
    /** Context / page-context side queries */
    context: 60_000,
    /** Filter option queries (facets, remote options) */
    filterOptions: 30_000,
  },
  refetchOnWindowFocus: false,
}
