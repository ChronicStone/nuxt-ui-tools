import type { DisplayBlockBase, DisplayContent, DisplayRevealable, DisplaySurface } from '../shared'

export type DisplayTableSlot =
  | 'root'
  | 'scroller'
  | 'table'
  | 'head'
  | 'headCell'
  | 'row'
  | 'cell'
  | 'foot'
  | 'footCell'
  | 'meta'
  | 'empty'
  | 'more'

export interface DisplayTableColumn {
  key: string
  label: DisplayContent
  /** Tabular figures aligned to the end. */
  numeric?: boolean
  /** Defaults to `end` for numeric columns, `start` otherwise. */
  align?: 'start' | 'center' | 'end'
  /** CSS width, such as `8rem` or `30%`. */
  width?: string
  mono?: boolean
}

export type DisplayTableRow = Readonly<Record<string, DisplayContent>>

export interface DisplayTableProps extends DisplayBlockBase<DisplayTableSlot>, DisplayRevealable {
  columns: readonly DisplayTableColumn[]
  rows: readonly DisplayTableRow[]
  /** Totals or averages pinned under the rows. */
  footer?: DisplayTableRow
  /** Line under the table, at the start. */
  caption?: DisplayContent
  /** Line under the table, at the end. */
  note?: DisplayContent
  /** Scrolls the rows past this height, with the header and footer pinned (px or CSS length). */
  maxHeight?: number | string
  /** Defaults to `bordered`. */
  surface?: DisplaySurface
}
