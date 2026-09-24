import type { QueryKey } from '@tanstack/vue-query'

import type {
  RemoteOptionsLoader,
  RemoteOptionsPagination,
  RemoteOptionsSearch,
} from '../../shared/types/remote-options'
import type { TableResolvedFilterGroup } from './filters'
import type {
  TableCursorPageResult,
  TableOffsetPageResult,
  TableRemoteSourceRequest,
  TableSourceExecutionResult,
  TableSourceQueryResult,
  TableSourceRow,
} from './source'
import type { GenericObject, TableKnownFieldPath, TableSortingRule, TableSortKey } from './utils'

/** Response of an endpoint speaking the table request protocol. */
export type RemoteTableResult<TRow extends GenericObject> =
  | TableOffsetPageResult<TRow, string>
  | TableCursorPageResult<TRow, string>
  | TableSourceExecutionResult<TRow, string>

/** Option built from one row: a value and a label, plus any extra option fields. */
export interface RemoteTableOption {
  value: string | number
  label: string
}

/** A TanStack query definition: its key, and a `queryFn` or the options that carry one. */
export interface RemoteTableQueryDefinition {
  queryKey: QueryKey
}

/**
 * Query definition of one table request, typically the endpoint a remote table already uses:
 * `(request) => $api.accounts.query.queryOptions({ body: request })`. The row type is read from
 * its result, as `tableSource` does.
 */
export type RemoteTableQuery<
  TQuery extends RemoteTableQueryDefinition = RemoteTableQueryDefinition,
> = (request: TableRemoteSourceRequest) => TQuery

/** Row type of the table response a `RemoteTableQuery` resolves to. */
export type RemoteTableQueryRow<TQuery> = TableSourceRow<TableSourceQueryResult<TQuery>>

export interface RemoteTableOptionsConfig<
  TRow extends GenericObject,
  TOption extends RemoteTableOption,
> {
  /** Option of one row. A method, so the typed callback fits the builder's erased signature. */
  option(row: TRow): TOption
  /**
   * Fields the search term looks in, or those fields with the debounce (default 250 ms) and
   * minimum term length (default 0).
   */
  search?:
    | readonly TableKnownFieldPath<TRow>[]
    | ({ fields: readonly TableKnownFieldPath<TRow>[] } & RemoteOptionsSearch)
  /** Order of the options: a field, ascending, or explicit sorting rules. */
  sort?: TableSortKey<TRow> | readonly TableSortingRule<TableSortKey<TRow>>[]
  /**
   * Field holding the option value, matched with `isAnyOf` to resolve the labels of selected
   * values the loaded pages do not contain. Defaults to `'id'`.
   */
  valueKey?: TableKnownFieldPath<TRow> | 'id'
  /** Filters applied to every request, e.g. active accounts only. */
  filters?: readonly TableResolvedFilterGroup<TableKnownFieldPath<TRow> | string>[]
  /** Page type and size. Must match what the endpoint pages by. Defaults to cursor pages of 25. */
  pagination?: RemoteOptionsPagination
}

/**
 * Remote option source built by `remoteTableOptions()`. It fits dashboard `p.remote()`, table
 * option filters (`source.remote`), and form remote options (`loader: options`).
 */
export type RemoteTableOptions<TOption> = RemoteOptionsLoader<TOption>
