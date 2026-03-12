import { watch } from 'vue'
import type { GenericObject } from '../types'
import type { TableStateRefs, TableMetaRefs } from './use-table-state'

/**
 * Derives selectedRows and selectedCount from selectedRowKeys + rows.
 * Writes derived values back into metaRefs.
 *
 * Also prunes selectedRowKeys when rows change (removes keys no longer in the current page).
 */
export function useTableSelection<
  TRow extends GenericObject = GenericObject,
>(
  schema: { rowKey: string | readonly string[] },
  stateRefs: TableStateRefs,
  metaRefs: TableMetaRefs<TRow, any, any>,
): void {
  function getRowKey(row: TRow): string | number {
    const key = schema.rowKey
    if (Array.isArray(key)) {
      return key.map(k => String((row as Record<string, unknown>)[k] ?? '')).join('::')
    }
    return (row as Record<string, unknown>)[key as string] as string | number
  }

  function deriveSelection(): void {
    const keys = stateRefs.selectedRowKeys.value
    const rows = metaRefs.rows.value as TRow[]
    const selected = rows.filter(row => keys.includes(getRowKey(row)))
    metaRefs.selectedRows.value = selected
    metaRefs.selectedCount.value = selected.length
  }

  // Prune invalid keys when rows change (page navigation, refresh)
  watch(
    metaRefs.rows,
    (rows) => {
      const validKeys = new Set((rows as TRow[]).map(row => getRowKey(row)))
      const current = stateRefs.selectedRowKeys.value
      const pruned = current.filter(k => validKeys.has(k))
      if (pruned.length !== current.length) {
        stateRefs.selectedRowKeys.value = pruned
      }
      deriveSelection()
    },
    { deep: false },
  )

  // Derive when selection changes
  watch(stateRefs.selectedRowKeys, () => deriveSelection(), { deep: true })
}

/**
 * Returns selection API methods — thin wrappers over stateRefs mutations.
 */
export function createSelectionApi<
  TRow extends GenericObject = GenericObject,
>(
  schema: { rowKey: string | readonly string[] },
  stateRefs: TableStateRefs,
  metaRefs: TableMetaRefs<TRow, any, any>,
) {
  function getRowKey(row: TRow): string | number {
    const key = schema.rowKey
    if (Array.isArray(key)) {
      return key.map(k => String((row as Record<string, unknown>)[k] ?? '')).join('::')
    }
    return (row as Record<string, unknown>)[key as string] as string | number
  }

  return {
    clearSelection(): void {
      stateRefs.selectedRowKeys.value = []
    },
    setSelection(keys: readonly (string | number)[]): void {
      stateRefs.selectedRowKeys.value = [...keys]
    },
    toggleSelection(key: string | number): void {
      const keys = stateRefs.selectedRowKeys.value
      const idx = keys.indexOf(key)
      if (idx === -1) {
        stateRefs.selectedRowKeys.value = [...keys, key]
      }
      else {
        stateRefs.selectedRowKeys.value = keys.filter((_, i) => i !== idx)
      }
    },
    selectRow(row: TRow): void {
      const key = getRowKey(row)
      if (!stateRefs.selectedRowKeys.value.includes(key)) {
        stateRefs.selectedRowKeys.value = [...stateRefs.selectedRowKeys.value, key]
      }
    },
    deselectRow(row: TRow): void {
      const key = getRowKey(row)
      stateRefs.selectedRowKeys.value = stateRefs.selectedRowKeys.value.filter(k => k !== key)
    },
  }
}
