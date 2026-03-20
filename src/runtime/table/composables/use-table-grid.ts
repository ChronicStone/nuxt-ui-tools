import { computed, type ComputedRef } from 'vue'

import { getResponsiveValue } from '#ui-tools/shared'

import { GRID_DEFAULTS } from '../constants/grid'
import type { GenericObject, TableExternalState, TableGridMode, TableSchemaView } from '../types'

export interface GridRowChunk<TRow = unknown> {
  index: number
  start: number
  end: number
  rows: TRow[]
}

export interface UseTableGridParams<TRow extends GenericObject = GenericObject> {
  schema: ComputedRef<TableSchemaView>
  data: ComputedRef<TableExternalState<TRow>>
}

export function useTableGrid<TRow extends GenericObject>(options: UseTableGridParams<TRow>) {
  const resolvedGridColumns = computed(() =>
    resolveResponsiveGridNumber(options.schema.value.grid?.gridSize ?? GRID_DEFAULTS.columns),
  )
  const resolvedItemSpan = computed(() =>
    resolveResponsiveGridNumber(options.schema.value.grid?.itemSize ?? GRID_DEFAULTS.itemSpan),
  )

  const mode = computed<TableGridMode>(() => options.schema.value.grid?.mode ?? GRID_DEFAULTS.mode)
  const columnCount = computed(() => clampGridUnit(resolvedGridColumns.value ?? GRID_DEFAULTS.columns))
  const itemColumnSpan = computed(() =>
    Math.min(columnCount.value, clampGridUnit(resolvedItemSpan.value ?? columnCount.value)),
  )
  const cardsPerRow = computed(() =>
    Math.max(1, Math.floor(columnCount.value / itemColumnSpan.value)),
  )
  const rows = computed(() => options.data.value.rows)
  const rowChunks = computed(() =>
    chunkRows({
      rows: rows.value,
      cardsPerRow: cardsPerRow.value,
    }),
  )

  return {
    mode,
    rows,
    rowChunks,
    columnCount,
    itemColumnSpan,
    cardsPerRow,
  }
}

function clampGridUnit(value: number) {
  return Math.max(1, Math.floor(value))
}

function resolveResponsiveGridNumber(value: number | string | (() => number | string)) {
  const resolvedValue = typeof value === 'function' ? value() : value
  if (typeof resolvedValue === 'number') return resolvedValue

  return getResponsiveValue(resolvedValue, 'integer')
}

function chunkRows<TRow>(options: { rows: TRow[]; cardsPerRow: number }): GridRowChunk<TRow>[] {
  return Array.from({ length: Math.ceil(options.rows.length / options.cardsPerRow) }, (_, index) => {
    const start = index * options.cardsPerRow
    const end = start + options.cardsPerRow

    return {
      index,
      start,
      end,
      rows: options.rows.slice(start, end),
    }
  })
}
