import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, getCurrentInstance, onMounted, onScopeDispose, ref, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'

import {
  ROW_CONCEAL_MS,
  ROW_MOTION_LIMIT,
  ROW_REVEAL_MS,
  ROW_STAGGER_LIMIT,
  ROW_STAGGER_MS,
} from '../constants/row-motion'
import type { GenericObject, TableGroup, TableSchemaView, TableTreeMotion } from '../types'
import {
  buildTableGroups,
  parseStoredGroupKeys,
  tableGroupRow,
  tableGroupsStorageKey,
} from '../utils/groups'
import { resolveTableRowId } from '../utils/rows'
import type { UseTableDataReturn } from './use-table-data'
import type { useTableLayout } from './use-table-layout'

export interface UseTableGroupsParams {
  schema: ComputedRef<TableSchemaView>
  layout: ReturnType<typeof useTableLayout>
  queryContent: Pick<UseTableDataReturn, 'data'>
}

/**
 * Owns row groups: which groups the loaded rows form, which are folded, and the motion of folding
 * one. The data stays flat; `displayRows` adds the header rows to what the table renders.
 *
 * Fold state is the schema's `collapsed` plus the groups the reader toggled, kept per table so a
 * trip to a record and back finds the list as it was left. A table with `table.tree` has its own
 * hierarchy and is not grouped.
 */
export function useTableGroups(params: UseTableGroupsParams) {
  const reducedMotion = usePreferredReducedMotion()

  const config = computed(() => {
    const { grid, table } = params.schema.value
    if (params.layout.activeLayout.value === 'grid') return grid?.groupBy
    return table?.tree ? undefined : table?.groupBy
  })
  const enabled = computed(() => Boolean(config.value))

  const groups = computed<TableGroup[]>(() => {
    const groupBy = config.value
    if (!groupBy) return []
    return buildTableGroups({
      getRowId: (row, index) =>
        String(resolveTableRowId({ index, row, rowKey: params.schema.value.rowKey })),
      groupBy,
      rows: params.queryContent.data.value.rows,
    })
  })

  /* ── fold state ────────────────────────────────────────────── */
  const toggled = ref<ReadonlySet<string>>(new Set<string>())
  const persists = computed(() => params.schema.value.persistence?.preferences !== false)

  function storage() {
    try {
      return typeof window === 'undefined' || !persists.value ? null : window.localStorage
    } catch {
      return null
    }
  }

  function restore() {
    try {
      const raw = storage()?.getItem(tableGroupsStorageKey(params.schema.value.tableKey)) ?? null
      toggled.value = new Set(parseStoredGroupKeys(raw))
    } catch {
      toggled.value = new Set<string>()
    }
  }

  function remember() {
    const key = tableGroupsStorageKey(params.schema.value.tableKey)
    try {
      if (toggled.value.size) storage()?.setItem(key, JSON.stringify([...toggled.value]))
      else storage()?.removeItem(key)
    } catch {
      return
    }
  }

  /* After mount, so a server-rendered list hydrates with the schema's state first. */
  if (getCurrentInstance()) onMounted(restore)
  else restore()

  function startsCollapsed(group: TableGroup) {
    const collapsed = config.value?.collapsed
    return typeof collapsed === 'function'
      ? collapsed({ rows: group.rows, value: group.value })
      : Boolean(collapsed)
  }

  /** What a chevron shows: a group that has started folding already reads as folded. */
  function isCollapsed(group: TableGroup) {
    return startsCollapsed(group) !== toggled.value.has(group.key)
  }

  function flip(group: TableGroup) {
    const next = new Set(toggled.value)
    if (!next.delete(group.key)) next.add(group.key)
    toggled.value = next
    remember()
  }

  /* ── motion ────────────────────────────────────────────────── */
  const motion = shallowRef<ReadonlyMap<string, TableTreeMotion> | null>(null)
  /** The group playing its folding motion; its rows stay listed until that ends. */
  const closing = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  function settle() {
    clearTimeout(timer)
    closing.value = null
    motion.value = null
  }

  /**
   * Folds or unfolds a group with its rows moving rather than jumping. Like a tree branch, this
   * animates opacity and a few pixels of translate on the rows, never a height, so the virtualizer
   * has nothing to re-measure.
   */
  function toggle(group: TableGroup) {
    settle()
    const opening = isCollapsed(group)
    flip(group)
    if (reducedMotion.value === 'reduce' || params.layout.activeLayout.value === 'grid') return

    const moving = group.rowIds.slice(0, ROW_MOTION_LIMIT)
    motion.value = new Map(
      moving.map((rowId, order): [string, TableTreeMotion] => [
        rowId,
        { kind: opening ? 'enter' : 'leave', order: Math.min(order, ROW_STAGGER_LIMIT) },
      ]),
    )
    if (opening) {
      timer = setTimeout(
        settle,
        ROW_REVEAL_MS + Math.min(moving.length, ROW_STAGGER_LIMIT) * ROW_STAGGER_MS,
      )
      return
    }
    closing.value = group.key
    timer = setTimeout(settle, ROW_CONCEAL_MS)
  }

  onScopeDispose(() => clearTimeout(timer))

  function motionOf(rowId: string) {
    return motion.value?.get(rowId)
  }

  /* ── what is on screen ─────────────────────────────────────── */
  function rowsListed(group: TableGroup) {
    return !isCollapsed(group) || closing.value === group.key
  }

  /** Each group's header followed by its rows, or by nothing while it is folded. */
  const displayRows = computed<GenericObject[]>(() =>
    groups.value.flatMap((group) => [
      tableGroupRow(group),
      ...(rowsListed(group) ? group.rows : []),
    ]),
  )
  /** The rows in the order groups show them, folded ones included, so an index into it is stable. */
  const orderedRows = computed<GenericObject[]>(() => groups.value.flatMap((group) => group.rows))
  /** Rows a shift-click range can cross: the ones on screen, so a folded group is not selected unseen. */
  const visibleRowIds = computed(() =>
    groups.value.flatMap((group) => (isCollapsed(group) ? [] : group.rowIds)),
  )

  return {
    config,
    displayRows,
    enabled,
    groups,
    isCollapsed,
    motionOf,
    orderedRows,
    toggle,
    visibleRowIds,
  }
}
