import { isNumber } from '../../shared/utils/predicate'

/**
 * Flex item style of one grid cell. Dashboard grids are wrapping flex rows: a cell's basis is the
 * width its `size` spans over the grid's columns (the same widths a CSS grid would give), so rows
 * break where the column count says. When `fill` is on, a row that is not full (a block hidden
 * because its source is disabled, or a short last row) shares the free width between its cells in
 * proportion to their span, so no gap is left.
 *
 * `span` is the resolved column span, `null` for a full-row cell.
 */
export function resolveDashboardCellStyle(params: {
  span: number | null
  columns: number
  gap: string
  fill: boolean
}): string {
  const columns = Math.max(1, Math.round(params.columns))
  const span =
    params.span === null || !Number.isFinite(params.span)
      ? columns
      : Math.min(columns, Math.max(1, Math.round(params.span)))
  if (span >= columns) return 'flex: 1 1 100%; min-width: 0'
  const { gap } = params
  // The basis a CSS grid track run would have, minus a hair so rounding never wraps a full row.
  const basis = `calc((100% - ${columns - 1} * ${gap}) / ${columns} * ${span} + ${span - 1} * ${gap} - 0.02px)`
  return `flex: ${params.fill ? span : 0} 1 ${basis}; min-width: 0`
}

/** Parses a resolved responsive token (`"8"`) into a positive integer, `null` when unset. */
export function parseDashboardSpan(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = isNumber(value) ? value : Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
