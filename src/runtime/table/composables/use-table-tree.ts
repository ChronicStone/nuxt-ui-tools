import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, onScopeDispose, reactive, ref, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'

import type {
  GenericObject,
  TableExpansionApi,
  TableSchemaView,
  TableTreeIndex,
  TableTreeMotion,
  TableTreeNode,
} from '../types'
import { resolveTableRowId } from '../utils/rows'
import {
  buildTableTree,
  flattenVisibleTree,
  getTreeLineage,
  getVisibleDescendants,
  isOpenByDefault,
} from '../utils/tree'
import type { UseTableDataReturn } from './use-table-data'

/** How long a closing branch plays out before its rows leave the list. */
const CONCEAL_MS = 120
/** How long the last revealed row takes to settle; the renderer's CSS owns the actual timing. */
const REVEAL_MS = 190
const STAGGER_MS = 24
/** Rows beyond these start or stop without a transition: they are mostly off screen anyway. */
const MOTION_ROW_LIMIT = 24
const STAGGER_ROW_LIMIT = 8

const EMPTY_INDEX: TableTreeIndex = {
  branches: [],
  byId: new Map(),
  duplicateIds: [],
  maxDepth: 0,
  roots: [],
}

export interface UseTableTreeParams {
  schema: ComputedRef<TableSchemaView>
  queryContent: Pick<UseTableDataReturn, 'data'>
}

/**
 * Owns tree rows: which rows are open, the flat list of rows that are on screen, and the motion
 * of a branch opening or closing.
 *
 * Expansion is a baseline plus per-row overrides rather than a set of open ids. The baseline is
 * the schema's `defaultExpanded` (or what `expandAll` / `collapseAll` last chose), so rows that
 * load later, such as the next cursor page, follow it without being enumerated; an override only
 * exists for a row someone actually toggled, and is dropped again if it matches the baseline.
 *
 * TanStack's expanded row model is deliberately not used: it materialises every descendant before
 * the virtualizer sees a row. The nested source rows stay as they are, `visibleNodes` flattens
 * only what is open, and that list is what the renderer virtualizes.
 */
export function useTableTree(params: UseTableTreeParams) {
  const reducedMotion = usePreferredReducedMotion()

  const config = computed(() => params.schema.value.table?.tree)
  const enabled = computed(() => Boolean(config.value))
  const defaultExpanded = computed(() => config.value?.defaultExpanded ?? false)
  const selectable = computed(() => config.value?.selectable ?? 'all')

  const index = computed<TableTreeIndex>(() => {
    const tree = config.value
    if (!tree) return EMPTY_INDEX

    const built = buildTableTree({
      childrenPath: tree.children,
      getRowId: (row, position) =>
        String(resolveTableRowId({ index: position, row, rowKey: params.schema.value.rowKey })),
      rows: params.queryContent.data.value.rows,
    })
    if (built.duplicateIds.length && process.env.NODE_ENV !== 'production')
      console.warn(
        `[nuxt-ui-tools] Tree rows must have unique ids across the whole tree; left out duplicates of: ${built.duplicateIds.slice(0, 5).join(', ')}`,
      )
    return built
  })

  /* ── expansion state ───────────────────────────────────────── */
  const baseline = ref<boolean | number | null>(null)
  /* A reactive map tracks each key on its own: toggling one row only wakes what read that row. */
  const overrides = reactive(new Map<string, boolean>())
  /** Branches playing their closing motion; still open as far as the row list goes. */
  const closing = reactive(new Set<string>())

  function openByDefault(node: TableTreeNode) {
    return isOpenByDefault(baseline.value ?? defaultExpanded.value, node.depth)
  }

  function isNodeOpen(node: TableTreeNode) {
    return node.hasChildren && (overrides.get(node.id) ?? openByDefault(node))
  }

  function setNodeOpen(node: TableTreeNode, open: boolean) {
    if (!node.hasChildren) return
    if (open === openByDefault(node)) overrides.delete(node.id)
    else overrides.set(node.id, open)
  }

  /** What a chevron shows: a branch that has started closing already reads as closed. */
  function isExpanded(rowId: string) {
    const node = index.value.byId.get(rowId)
    return node !== undefined && isNodeOpen(node) && !closing.has(rowId)
  }

  function nodeOf(rowId: string) {
    return index.value.byId.get(rowId)
  }

  /** Whether a row can carry a checkbox: every row by default, only the top level on request. */
  function isSelectable(node: TableTreeNode) {
    return selectable.value === 'all' || node.depth === 0
  }

  function setExpanded(rowIds: string[], open: boolean) {
    for (const rowId of rowIds) {
      const node = index.value.byId.get(rowId)
      if (node) setNodeOpen(node, open)
    }
  }

  function setAll(open: boolean | null) {
    settle()
    baseline.value = open
    overrides.clear()
  }

  /* ── what is on screen ─────────────────────────────────────── */
  const visibleNodes = computed(() => flattenVisibleTree(index.value.roots, isNodeOpen))
  const visibleRows = computed<GenericObject[]>(() => visibleNodes.value.map((node) => node.row))

  /* ── motion ────────────────────────────────────────────────── */
  const motion = shallowRef<ReadonlyMap<string, TableTreeMotion> | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let closingNode: TableTreeNode | undefined

  function motionOf(rowId: string) {
    return motion.value?.get(rowId)
  }

  function playMotion(kind: TableTreeMotion['kind'], branch: TableTreeNode) {
    const rows = getVisibleDescendants(visibleNodes.value, branch, MOTION_ROW_LIMIT)
    motion.value = new Map(
      rows.map((node, order): [string, TableTreeMotion] => [
        node.id,
        { kind, order: Math.min(order, STAGGER_ROW_LIMIT) },
      ]),
    )
    return rows.length
  }

  /** Ends whatever motion is running, closing a branch that was still on its way out. */
  function settle() {
    clearTimeout(timer)
    if (closingNode) {
      setNodeOpen(closingNode, false)
      closing.delete(closingNode.id)
      closingNode = undefined
    }
    motion.value = null
  }

  /**
   * The chevron's path: opens or closes a branch with its rows moving rather than jumping.
   *
   * Opening reveals the new rows in place; closing lets them leave first and only then drops them
   * from the list. Both animate opacity and a few pixels of translate on the rows themselves, never
   * a height, so the virtualizer has nothing to re-measure while it plays.
   */
  function toggleRow(rowId: string) {
    const node = index.value.byId.get(rowId)
    if (!node?.hasChildren) return

    if (closingNode === node) {
      /* A second press while closing means "stay open". */
      clearTimeout(timer)
      closing.delete(rowId)
      closingNode = undefined
      motion.value = null
      return
    }

    settle()
    const open = isNodeOpen(node)
    if (reducedMotion.value === 'reduce') {
      setNodeOpen(node, !open)
      return
    }

    if (!open) {
      setNodeOpen(node, true)
      const revealed = playMotion('enter', node)
      timer = setTimeout(
        () => (motion.value = null),
        REVEAL_MS + Math.min(revealed, STAGGER_ROW_LIMIT) * STAGGER_MS,
      )
      return
    }

    if (!playMotion('leave', node)) {
      setNodeOpen(node, false)
      return
    }
    closingNode = node
    closing.add(rowId)
    timer = setTimeout(settle, CONCEAL_MS)
  }

  onScopeDispose(() => clearTimeout(timer))

  /* ── lineage under the pointer ─────────────────────────────── */
  /*
   * Hovering a row lights the path that leads to it, including the rows above the pointer.
   *
   * CSS cannot reach earlier rows, so each gutter asks whether its group is lit. A gutter at level
   * `k` belongs to the group of the row's `k`-th ancestor: the vertical its children hang from.
   * The lit stretch of that vertical runs from the group's first child down to the child on the
   * path, where it turns into that child's chevron, so a group is mapped to the flat index of the
   * path child. Keys are tracked one by one: moving the pointer only wakes the gutters that change
   * colour, never the table.
   */
  const flatIndexById = computed(
    () => new Map(visibleNodes.value.map((node, position) => [node.id, position])),
  )
  const litUntilByGroup = reactive(new Map<string, number>())
  /** Open branches the path passes through; their chevron's stub lights too. */
  const onPath = reactive(new Set<string>())

  function lightLineage(rowId?: string) {
    const node = rowId === undefined ? undefined : index.value.byId.get(rowId)
    const lineage = node ? getTreeLineage(node).map((entry) => entry.id) : []
    const groups = lineage.slice(0, -1)
    for (const group of litUntilByGroup.keys())
      if (!groups.includes(group)) litUntilByGroup.delete(group)
    for (const group of onPath) if (!groups.includes(group)) onPath.delete(group)
    for (const [position, group] of groups.entries()) {
      const child = lineage[position + 1]
      litUntilByGroup.set(group, child === undefined ? -1 : (flatIndexById.value.get(child) ?? -1))
      onPath.add(group)
    }
  }

  /** The last row index a group's vertical is lit down to, or `-1` when it is not lit. */
  function litUntil(groupId: string) {
    return litUntilByGroup.get(groupId) ?? -1
  }

  function isOnPath(rowId: string) {
    return onPath.has(rowId)
  }

  /* ── public surface ────────────────────────────────────────── */
  const expansion: TableExpansionApi = {
    collapse: (rowIds) => setExpanded(rowIds, false),
    collapseAll: () => setAll(false),
    expand: (rowIds) => setExpanded(rowIds, true),
    expandAll: () => setAll(true),
    isExpanded,
    reset: () => setAll(null),
    state: computed(() => {
      const { branches } = index.value
      const expandedKeys = branches.filter(isNodeOpen).map((node) => node.id)
      return {
        allExpanded: branches.length > 0 && expandedKeys.length === branches.length,
        branchCount: branches.length,
        enabled: enabled.value,
        expandedCount: expandedKeys.length,
        expandedKeys,
      }
    }),
    toggle: ({ expanded, rowId }) => setExpanded([rowId], expanded ?? !isExpanded(rowId)),
  }

  return {
    enabled,
    expansion,
    index,
    isExpanded,
    isOnPath,
    isSelectable,
    lightLineage,
    litUntil,
    motionOf,
    nodeOf,
    selectable,
    toggleRow,
    visibleNodes,
    visibleRows,
  }
}
