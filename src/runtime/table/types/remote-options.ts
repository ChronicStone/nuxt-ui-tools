import type { QueryDefinition, QueryFnDefinition } from '../../shared/types/query'
import type {
  RemoteOptionsPageRequest,
  RemoteOptionsPagination,
  RemoteOptionsResult,
  RemoteOptionsSearch,
} from '../../shared/types/remote-options'
import type { TableResolvedFilterGroup } from './filters'
import type {
  TableCursorPageResult,
  TableOffsetPageResult,
  TableRemoteSourceRequest,
  TableSourceExecutionResult,
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

export interface RemoteTableOptionsConfig<
  TRow extends GenericObject,
  TOption extends RemoteTableOption,
> {
  /**
   * Query definition of one table request, typically the endpoint a remote table already uses:
   * `(request) => $api.accounts.query.queryOptions({ body: request })`.
   */
  query: (request: TableRemoteSourceRequest<TRow>) => QueryDefinition<RemoteTableResult<TRow>>
  /** Option of one row. */
  option: (row: TRow) => TOption
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
 * option filters (`source.remote`), and form remote options (`source: options.load`).
 */
export interface RemoteTableOptions<TOption> {
  /** Query definition of one page of options for a search term. */
  load: (request: {
    search: string
    page: RemoteOptionsPageRequest
  }) => QueryFnDefinition<RemoteOptionsResult<TOption>>
  /** Query definition of the options of selected values. */
  resolveSelected: (request: {
    values: readonly (string | number | boolean)[]
  }) => QueryFnDefinition<readonly TOption[]>
  pagination: RemoteOptionsPagination
  search?: RemoteOptionsSearch
}
