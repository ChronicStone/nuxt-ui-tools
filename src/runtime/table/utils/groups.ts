import type { GenericObject, TableGroup, TableGroupBySchema } from '../types'
import { getTableRowValue } from './rows'

/** Marks a display row as a group's header; the renderers tell it from a record by this key. */
const GROUP_ROW_KEY = '__nutTableGroup'

function groupValueOf<TRow extends GenericObject>(row: TRow, groupBy: TableGroupBySchema<TRow>) {
  const { key } = groupBy
  const value = typeof key === 'function' ? key(row) : getTableRowValue({ path: String(key), row })
  return value === null || value === undefined || value === '' ? undefined : value
}

/** Listed values first in their order, then the rest by value with numbers read as numbers, empty last. */
function compareGroupValues(order: readonly unknown[], left: unknown, right: unknown) {
  const leftRank = order.indexOf(left)
  const rightRank = order.indexOf(right)
  if (leftRank !== -1 && rightRank !== -1) return leftRank - rightRank
  if (leftRank !== -1) return -1
  if (rightRank !== -1) return 1
  if (left === undefined) return 1
  if (right === undefined) return -1
  return String(left).localeCompare(String(right), undefined, { numeric: true })
}

/**
 * Brings the rows sharing a value together. Rows keep their order inside a group, so the sort the
 * source applied survives in each one.
 */
export function buildTableGroups<TRow extends GenericObject>(options: {
  rows: TRow[]
  groupBy: TableGroupBySchema<TRow>
  getRowId: (row: TRow, index: number) => string
}): TableGroup<TRow>[] {
  const groups = new Map<unknown, { rows: TRow[]; rowIds: string[] }>()
  for (const [index, row] of options.rows.entries()) {
    const value = groupValueOf(row, options.groupBy)
    const group = groups.get(value) ?? { rowIds: [], rows: [] }
    group.rows.push(row)
    group.rowIds.push(options.getRowId(row, index))
    groups.set(value, group)
  }
  const order = options.groupBy.order ?? []
  return [...groups.entries()]
    .sort(([left], [right]) => compareGroupValues(order, left, right))
    .map(([value, group]) => ({
      key: `group:${JSON.stringify(value ?? null)}`,
      rowIds: group.rowIds,
      rows: group.rows,
      value,
    }))
}

export function tableGroupRow(group: TableGroup): GenericObject {
  return { [GROUP_ROW_KEY]: group }
}

function isTableGroupRow(row: GenericObject): row is { [GROUP_ROW_KEY]: TableGroup } {
  return GROUP_ROW_KEY in row
}

export function tableGroupOf(row: GenericObject): TableGroup | undefined {
  return isTableGroupRow(row) ? row[GROUP_ROW_KEY] : undefined
}

export function tableGroupsStorageKey(tableKey: string) {
  return `nuxt-ui-tools:table-groups:${tableKey}`
}

export function parseStoredGroupKeys(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((key): key is string => typeof key === 'string')
      : []
  } catch {
    return []
  }
}
