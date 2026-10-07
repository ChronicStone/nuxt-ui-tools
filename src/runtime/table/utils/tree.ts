import { isObject } from '../../shared/utils/predicate'
import type { GenericObject, TableTreeIndex, TableTreeNode } from '../types'
import { getTableRowValue } from './rows'

/** Pixels one level of the tree adds: one rail gutter. The renderer hands the same number to CSS. */
export const TREE_GUTTER_WIDTH = 16
/** The chevron's footprint, which a childless row keeps free so its rail lines up. */
export const TREE_TOGGLE_WIDTH = 16
/** Between the chevron and the checkbox. */
export const TREE_GAP = 6
/** Least space before the first gutter; the table's own left gutter wins when it is wider. */
export const TREE_LEAD = 6
/** Clear space after the checkbox of the deepest row, so it never meets the column's edge. */
export const TREE_TRAIL = 6

/** Width of a Nuxt UI checkbox box at each control size, which the tree cell always reserves. */
export const TREE_CHECK_WIDTH = { lg: 18, md: 16, sm: 14, xl: 20, xs: 12 } as const

/**
 * The control column's width: lead, one gutter per level of the deepest loaded row, the chevron,
 * the checkbox and a little room after it. Every row shares it, so the first data column starts at
 * the same x on all of them and indentation happens inside the cell.
 */
export function getTreeColumnWidth(params: { lead: number; maxDepth: number; check: number }) {
  return (
    params.lead +
    params.maxDepth * TREE_GUTTER_WIDTH +
    TREE_TOGGLE_WIDTH +
    TREE_GAP +
    params.check +
    TREE_TRAIL
  )
}

/** Every row under `rows`, the rows themselves first, however deep and whether open or not. */
export function flattenTreeRows(
  rows: readonly GenericObject[],
  childrenPath: string,
): GenericObject[] {
  const flat: GenericObject[] = []
  const seen = new Set<GenericObject>()
  const stack = [...rows].reverse()

  for (let row = stack.pop(); row; row = stack.pop()) {
    if (seen.has(row)) continue
    seen.add(row)
    flat.push(row)
    const children = readChildren(row, childrenPath)
    for (let position = children.length - 1; position >= 0; position -= 1) {
      const child = children[position]
      if (child) stack.push(child)
    }
  }
  return flat
}

/** A node while its children are still being attached. */
interface GrowingTreeNode extends Omit<TableTreeNode, 'childNodes'> {
  childNodes: TableTreeNode[]
}

interface TreeFrame {
  rows: readonly GenericObject[]
  parent: GrowingTreeNode | null
}

/** The rows under `path`, minus anything that is not a row object. */
function readChildren(row: GenericObject, childrenPath: string): GenericObject[] {
  const value: unknown = getTableRowValue({ path: childrenPath, row })
  if (!Array.isArray(value)) return []

  const children: GenericObject[] = []
  for (const item of value) if (isObject(item)) children.push(item)
  return children
}

/**
 * Indexes the loaded rows once per data change: every node knows its depth, its parent and its
 * children, so toggling a branch never walks the source again. A node holds no per-row arrays,
 * which keeps the index linear however deep the tree goes.
 *
 * Built with an explicit stack, so a deep tree cannot overflow the call stack, and the nested
 * source rows are left untouched: nothing is copied, mapped or tagged.
 */
export function buildTableTree(params: {
  rows: readonly GenericObject[]
  childrenPath: string
  getRowId: (row: GenericObject, index: number) => string
}): TableTreeIndex {
  const byId = new Map<string, TableTreeNode>()
  const branches: TableTreeNode[] = []
  const duplicateIds: string[] = []
  const roots: TableTreeNode[] = []
  let maxDepth = 0

  const stack: TreeFrame[] = [{ parent: null, rows: params.rows }]
  for (let frame = stack.pop(); frame; frame = stack.pop()) {
    const depth = frame.parent ? frame.parent.depth + 1 : 0
    const siblings = frame.parent ? frame.parent.childNodes : roots
    const created: { node: GrowingTreeNode; children: GenericObject[] }[] = []
    const rootIndexBase = frame.parent?.rootIndex

    for (const [index, row] of frame.rows.entries()) {
      const id = params.getRowId(row, index)
      if (byId.has(id)) {
        duplicateIds.push(id)
        continue
      }

      const children = readChildren(row, params.childrenPath)
      const node: GrowingTreeNode = {
        childNodes: [],
        depth,
        hasChildren: children.length > 0,
        id,
        isLast: index === frame.rows.length - 1,
        parent: frame.parent,
        rootIndex: rootIndexBase ?? index,
        row,
      }
      byId.set(id, node)
      created.push({ children, node })
      siblings.push(node)
      if (depth > maxDepth) maxDepth = depth
      if (node.hasChildren) branches.push(node)
    }

    /* Children push in reverse so the stack pops them in document order. */
    for (let position = created.length - 1; position >= 0; position -= 1) {
      const entry = created[position]
      if (entry?.node.hasChildren) stack.push({ parent: entry.node, rows: entry.children })
    }
  }

  return { branches, byId, duplicateIds, maxDepth, roots }
}

/** The rows from the top level down to `node`, inclusive. */
export function getTreeLineage(node: TableTreeNode) {
  const lineage: TableTreeNode[] = []
  for (let current: TableTreeNode | null = node; current; current = current.parent)
    lineage.unshift(current)
  return lineage
}

/**
 * One flag per gutter between the top level and the row's own: whether the ancestor that gutter
 * belongs to still has a sibling below, so its rail runs through the row. A rail is only drawn
 * through a row where the answer is yes, which is what stops a branch at its last child.
 */
export function getTreeRails(node: TableTreeNode) {
  return getTreeLineage(node)
    .slice(1, -1)
    .map((ancestor) => !ancestor.isLast)
}

/**
 * The rows that are on screen: every top-level row, then the children of each open branch.
 *
 * This replaces TanStack's expanded row model on purpose. That model materialises every
 * descendant before the virtualizer sees a row; here only the visible rows exist, so closed
 * branches cost nothing however large they are.
 */
export function flattenVisibleTree(
  roots: readonly TableTreeNode[],
  isExpanded: (node: TableTreeNode) => boolean,
): TableTreeNode[] {
  const visible: TableTreeNode[] = []
  const stack = [...roots].reverse()

  for (let node = stack.pop(); node; node = stack.pop()) {
    visible.push(node)
    if (!node.hasChildren || !isExpanded(node)) continue
    for (let position = node.childNodes.length - 1; position >= 0; position -= 1) {
      const child = node.childNodes[position]
      if (child) stack.push(child)
    }
  }

  return visible
}

/** The rows currently showing beneath `branch`, which follow it contiguously in `visible`. */
export function getVisibleDescendants(
  visible: readonly TableTreeNode[],
  branch: TableTreeNode,
  limit = Number.POSITIVE_INFINITY,
): TableTreeNode[] {
  const start = visible.indexOf(branch)
  if (start === -1) return []

  const descendants: TableTreeNode[] = []
  for (let index = start + 1; index < visible.length && descendants.length < limit; index += 1) {
    const node = visible[index]
    if (!node || node.depth <= branch.depth) break
    descendants.push(node)
  }
  return descendants
}

/** Whether `branch` starts open under a `defaultExpanded` setting. */
export function isOpenByDefault(defaultExpanded: boolean | number, depth: number) {
  return defaultExpanded === true || (defaultExpanded !== false && depth < defaultExpanded)
}
