import type { TableFilterOperator, TableQueryStateFilterKind } from '../types/query-state'

export const DEFAULT_FILTER_OPERATOR = {
  boolean: 'is',
  date: 'is',
  number: 'is',
  option: 'isAnyOf',
  text: 'contains',
} satisfies Record<TableQueryStateFilterKind, TableFilterOperator>

/** URL and rule value of an option filter's « none » entry (`source.none`): the field is empty. */
export const TABLE_FILTER_NONE_VALUE = '~none'
/** Default icon of the « none » entry. */
export const TABLE_FILTER_NONE_ICON = 'i-lucide-circle-slash'

export const PAGINATION_DEFAULTS = {
  defaultSize: { grid: 10, table: 50 },
  sizes: {
    grid: [10, 20, 50, 100],
    table: [10, 20, 50, 100, 200, 500],
  },
}

/** Default TanStack Query options applied to all table queries. */
export const QUERY_DEFAULTS = {
  refetchOnWindowFocus: false,
  /** How long fetched data is considered fresh (ms). Prevents refetches on remount/focus. */
  staleTime: {
    /** Context / page-context side queries */
    context: 60_000,
    /** Main data query */
    data: 30_000,
    /** Filter option queries (facets, remote options) */
    filterOptions: 30_000,
  },
}
