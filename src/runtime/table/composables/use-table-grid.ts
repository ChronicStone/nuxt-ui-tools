import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import { getResponsiveValue } from '#ui-tools/shared'

import { isFunction, isNumber } from '../../shared/utils/predicate'
import { GRID_DEFAULTS } from '../constants/grid'
import type {
  GenericObject,
  TableExternalState,
  TableGridMode,
  TableGroup,
  TableSchemaView,
} from '../types'
import type { useTableGroups } from './use-table-groups'

export interface GridRowChunk<TRow = unknown> {
  index: number
  start: number
  end: number
  rows: TRow[]
  /** The group this chunk is the header of; a header holds no rows. */
  group?: TableGroup
}

export interface UseTableGridParams<TRow extends GenericObject = GenericObject> {
  schema: ComputedRef<TableSchemaView>
  data: ComputedRef<TableExternalState<TRow>>
  groups: ReturnType<typeof useTableGroups>
}

export function useTableGrid<TRow extends GenericObject>(options: UseTableGridParams<TRow>) {
  const resolvedGridColumns = computed(() =>
    resolveResponsiveGridNumber(options.schema.value.grid?.gridSize ?? GRID_DEFAULTS.columns),
  )
  const resolvedItemSpan = computed(() =>
    resolveResponsiveGridNumber(options.schema.value.grid?.itemSize ?? GRID_DEFAULTS.itemSpan),
  )

  const mode = computed<TableGridMode>(() => options.schema.value.grid?.mode ?? GRID_DEFAULTS.mode)
  const columnCount = computed(() =>
    clampGridUnit(resolvedGridColumns.value ?? GRID_DEFAULTS.columns),
  )
  const itemColumnSpan = computed(() =>
    Math.min(columnCount.value, clampGridUnit(resolvedItemSpan.value ?? columnCount.value)),
  )
  const cardsPerRow = computed(() =>
    Math.max(1, Math.floor(columnCount.value / itemColumnSpan.value)),
  )
  const rows = computed<GenericObject[]>(() =>
    options.groups.enabled.value ? options.groups.orderedRows.value : options.data.value.rows,
  )
  const rowChunks = computed<GridRowChunk<GenericObject>[]>(() =>
    options.groups.enabled.value
      ? chunkGroups({
          cardsPerRow: cardsPerRow.value,
          groups: options.groups.groups.value,
          isCollapsed: options.groups.isCollapsed,
        })
      : chunkRows({
          cardsPerRow: cardsPerRow.value,
          rows: rows.value,
        }),
  )

  return {
    cardsPerRow,
    columnCount,
    itemColumnSpan,
    mode,
    rowChunks,
    rows,
  }
}

function clampGridUnit(value: number) {
  return Math.max(1, Math.floor(value))
}

function resolveResponsiveGridNumber(value: number | string | (() => number | string)) {
  const resolvedValue = isResponsiveGridValueResolver(value) ? value() : value
  if (isNumber(resolvedValue)) {
    return resolvedValue
  }

  return getResponsiveValue(resolvedValue, 'integer')
}

function isResponsiveGridValueResolver(
  value: number | string | (() => number | string),
): value is () => number | string {
  return isFunction(value)
}

/** Each group's header, then its cards; a chunk's `start` indexes the rows in group order. */
function chunkGroups(options: {
  groups: TableGroup[]
  cardsPerRow: number
  isCollapsed: (group: TableGroup) => boolean
}) {
  const chunks: GridRowChunk<GenericObject>[] = []
  let offset = 0
  for (const group of options.groups) {
    chunks.push({ end: offset, group, index: chunks.length, rows: [], start: offset })
    if (!options.isCollapsed(group)) {
      for (const chunk of chunkRows({ cardsPerRow: options.cardsPerRow, rows: group.rows })) {
        chunks.push({
          ...chunk,
          end: offset + chunk.end,
          index: chunks.length,
          start: offset + chunk.start,
        })
      }
    }
    offset += group.rows.length
  }
  return chunks
}

function chunkRows<TRow>(options: { rows: TRow[]; cardsPerRow: number }): GridRowChunk<TRow>[] {
  return Array.from(
    { length: Math.ceil(options.rows.length / options.cardsPerRow) },
    (_, index) => {
      const start = index * options.cardsPerRow
      const end = start + options.cardsPerRow

      return {
        end,
        index,
        rows: options.rows.slice(start, end),
        start,
      }
    },
  )
}
