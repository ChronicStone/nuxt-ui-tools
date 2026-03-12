import type { ComputedRef } from 'vue'
import type { GenericObject } from './utils'
import type { TableStateRefs, TableMetaRefs } from '../composables/use-table-state'
import type { TableEffectiveFilterRule } from '../composables/use-table-filters'
import type { TableSchema } from './schema'

// ---------------------------------------------------------------------------
// Public imperative API methods
// ---------------------------------------------------------------------------

export interface TableApiMethods<TRow extends GenericObject = GenericObject> {
  refresh: () => Promise<void>
  clearSelection: () => void
  setSelection: (keys: readonly (string | number)[]) => void
  toggleSelection: (key: string | number) => void
  selectRow: (row: TRow) => void
  deselectRow: (row: TRow) => void
}

// ---------------------------------------------------------------------------
// Public table instance — returned by useTable()
// ---------------------------------------------------------------------------

/**
 * The public table instance returned by `useTable()`.
 * Users pass this to `<DataList :table="..." />`.
 *
 * Contains:
 * - `state`: writable reactive refs for all user-controlled state
 * - `meta`:  read-only reactive refs for derived data (rows, loading, errors…)
 * - `api`:   imperative methods (refresh, selection management…)
 *
 * DataList reads `_schema` and `_effectiveFilters` to set up its injection scope.
 */
export interface TableInstance<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TFilterKey extends string = string,
  TSortKey extends string = string,
  TView extends string = string,
> {
  state: TableStateRefs<TFilterKey, TSortKey, TView>
  meta: TableMetaRefs<TRow, TContext, TPageContext>
  api: TableApiMethods<TRow>
  /** @internal Resolved plain schema — consumed by DataList to set up injection */
  _schema: TableSchema
  /** @internal Effective filter pipeline — consumed by DataList */
  _effectiveFilters: ComputedRef<readonly TableEffectiveFilterRule[]>
}

export type AnyTableInstance = TableInstance<GenericObject, GenericObject, GenericObject>

// ---------------------------------------------------------------------------
// Row-level API (used by column renderers and row-action callbacks)
// ---------------------------------------------------------------------------

export interface TableRowApi<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  row: TRow
  context: TContext
  pageContext: TPageContext
}
