import type { ComputedRef } from 'vue'

import type { GenericObject } from './utils'

/**
 * Keys of a row that hold an array of child rows.
 *
 * A row type with no such key (or an untyped one) falls back to `string`, so the option never
 * becomes unusable.
 */
export type TableChildrenKey<TRow extends GenericObject> = [ChildrenKeys<TRow>] extends [never]
  ? string
  : ChildrenKeys<TRow>

type ChildrenKeys<TRow extends GenericObject> = {
  [TKey in keyof TRow & string]-?: NonNullable<TRow[TKey]> extends readonly GenericObject[]
    ? TKey
    : never
}[keyof TRow & string]

/**
 * Turns the table into a tree: a row can hold child rows that open beneath it.
 *
 * The children travel with their parent in the source payload. Row ids (`rowKey`) must be unique
 * across the whole tree, not only among siblings. Pagination, sorting, filters, search and
 * summaries act on the top-level rows; a search or filter field may reach into the children with a
 * dotted path such as `creditNotes.number`, which keeps the parent row.
 *
 * @example
 * ```ts
 * table: {
 *   tree: { children: 'creditNotes', defaultExpanded: false },
 * }
 * ```
 */
export interface TableTreeSchema<TRow extends GenericObject = GenericObject> {
  /** Key of each row that holds its child rows. A row with no children shows no chevron. */
  children: TableChildrenKey<TRow>
  /**
   * Which branches start open. `true` opens every branch, a number opens that many levels
   * (`1` opens the top-level rows), `false` (the default) opens none. A branch the user or
   * `table.expansion` has toggled keeps that state.
   */
  defaultExpanded?: boolean | number
  /**
   * Which rows can be selected when the table has selection. `'all'` (the default) lets every row
   * carry a checkbox, children included, each one independent of its parent; `'roots'` limits the
   * checkboxes to the top-level rows. A row without a checkbox keeps its width, so nothing moves.
   */
  selectable?: 'all' | 'roots'
}

/** One loaded row with its place in the tree, resolved once per data change. */
export interface TableTreeNode {
  readonly id: string
  readonly row: GenericObject
  /** Top-level rows are depth `0`. */
  readonly depth: number
  readonly parent: TableTreeNode | null
  /** Position of the top-level row this node sits under. */
  readonly rootIndex: number
  readonly childNodes: readonly TableTreeNode[]
  readonly hasChildren: boolean
  /** No later sibling follows: the rail stops at this row's elbow. */
  readonly isLast: boolean
}

/** The motion a row plays while a branch opens or closes. */
export interface TableTreeMotion {
  kind: 'enter' | 'leave'
  /** Position in the stagger, so rows arrive one after another instead of all at once. */
  order: number
}

export interface TableTreeIndex {
  readonly roots: readonly TableTreeNode[]
  readonly byId: ReadonlyMap<string, TableTreeNode>
  /** Every node that has children. */
  readonly branches: readonly TableTreeNode[]
  readonly maxDepth: number
  /** Ids met more than once; the later rows are left out of the tree. */
  readonly duplicateIds: readonly string[]
}

export interface TableExpansionState {
  /** Whether the schema configured `table.tree`. */
  enabled: boolean
  /** Ids of the loaded rows that are open right now, defaults included. */
  expandedKeys: string[]
  expandedCount: number
  /** Loaded rows that have children. */
  branchCount: number
  allExpanded: boolean
}

export interface TableExpansionApi {
  state: ComputedRef<TableExpansionState>
  isExpanded: (rowId: string) => boolean
  /** Opens the given rows; ids without children are ignored. */
  expand: (rowIds: string[]) => void
  collapse: (rowIds: string[]) => void
  /** Flips a row, or sets it when `expanded` is given. */
  toggle: (options: { rowId: string; expanded?: boolean }) => void
  /** Opens every loaded branch, and every branch that loads later, until collapsed again. */
  expandAll: () => void
  collapseAll: () => void
  /** Returns every branch to the schema's `defaultExpanded`. */
  reset: () => void
}
