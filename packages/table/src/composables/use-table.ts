import { computed, toValue } from 'vue'

import type { TableSchema } from '../types'
import type { TableInstance } from '../types/api'
import type { TableSchemaSource } from '../types/utils'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
} from '../types/utils'
import { useTableContext, useTablePageContext } from './use-table-context'
import { useTableSource } from './use-table-source'
import { createTableStateRefs, createTableMetaRefs } from './use-table-state'

/**
 * Creates a reactive table instance from a schema.
 *
 * - Accepts schema as `TableSchemaSource<TSchema>` (ref-like, getter, or plain value).
 *   Schema is resolved once at setup time via `toValue`.
 * - Orchestrates context loading → source execution lifecycle.
 * - Does NOT call `provide` — DataList is the injection boundary.
 *   Pass the returned instance to `<DataList :table="..." />`.
 */
export function useTable<TSchema>(
  schemaSource: TableSchemaSource<TSchema>,
): TableInstance<
  ExtractTableRow<TSchema>,
  ExtractTableContextData<TSchema>,
  ExtractTablePageContextData<TSchema>
> {
  type TRow = ExtractTableRow<TSchema>
  type TContext = ExtractTableContextData<TSchema>
  type TPageContext = ExtractTablePageContextData<TSchema>

  // Resolve schema — handles ref-like {value}, getter (), or plain value
  const schema = toValue(schemaSource as any) as TSchema & TableSchema

  // -------------------------------------------------------------------------
  // State — one ref per logical piece
  // -------------------------------------------------------------------------

  const stateRefs = createTableStateRefs({
    layout: schema.defaultLayout ?? 'table',
  })

  // -------------------------------------------------------------------------
  // Meta — derived refs written by the source engine
  // -------------------------------------------------------------------------

  const metaRefs = createTableMetaRefs<TRow, TContext, TPageContext>()

  // -------------------------------------------------------------------------
  // Context loading
  // -------------------------------------------------------------------------

  useTableContext(
    schema.context ?? [],
    metaRefs.context,
    {
      isLoadingContext: metaRefs.isLoadingContext,
      errorContext: metaRefs.errorContext,
    },
    stateRefs.activeView,
  )

  // -------------------------------------------------------------------------
  // Source execution (query state engine + data fetching)
  // -------------------------------------------------------------------------

  const { refresh: refreshSource } = useTableSource(
    schema as unknown as TableSchema,
    stateRefs,
    metaRefs,
  )

  // -------------------------------------------------------------------------
  // Page context — reactive queries that run after each source fetch
  // -------------------------------------------------------------------------

  useTablePageContext(
    (schema.pageContext ?? []) as any[],
    metaRefs,
    stateRefs.activeView,
  )

  // -------------------------------------------------------------------------
  // Public API methods
  // -------------------------------------------------------------------------

  const api = {
    async refresh(): Promise<void> {
      await refreshSource()
    },

    clearSelection(): void {
      stateRefs.selectedRowKeys.value = []
    },

    setSelection(keys: readonly (string | number)[]): void {
      stateRefs.selectedRowKeys.value = [...keys]
    },

    toggleSelection(key: string | number): void {
      const keys = stateRefs.selectedRowKeys.value
      const idx = keys.indexOf(key)
      stateRefs.selectedRowKeys.value =
        idx === -1 ? [...keys, key] : keys.filter((_, i) => i !== idx)
    },

    selectRow(_row: TRow): void {
      // TODO: implement with row key extraction
    },

    deselectRow(_row: TRow): void {
      // TODO: implement with row key extraction
    },
  }

  // -------------------------------------------------------------------------
  // Return typed instance
  // -------------------------------------------------------------------------

  return {
    state: stateRefs as any,
    meta: metaRefs as any,
    api,
    _schema: schema as unknown as TableSchema,
    _effectiveFilters: computed(() => []),
  }
}
