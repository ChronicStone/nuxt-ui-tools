import type { DisplayBlockBase, DisplayChip, DisplayContent } from '../shared'

export type DisplayDiffSlot =
  | 'root'
  | 'title'
  | 'item'
  | 'label'
  | 'values'
  | 'before'
  | 'after'
  | 'arrow'
  | 'note'
  | 'unchanged'
  | 'frame'
  | 'table'
  | 'headCell'
  | 'cell'

export interface DisplayDiffItem {
  label: DisplayContent
  before?: DisplayContent
  after?: DisplayContent
  /** Defaults to `true`. Unchanged rows are dimmed in `columns`, and hidden in `inline` unless `showUnchanged`. */
  changed?: boolean
  note?: DisplayChip
}

export interface DisplayDiffProps extends DisplayBlockBase<DisplayDiffSlot> {
  /** `inline` strikes the old value before the new one, `columns` sets them side by side. Defaults to `inline`. */
  variant?: 'inline' | 'columns'
  title?: DisplayContent
  /** `columns` headings: the field, the old value, the new value. Default to localized words. */
  columns?: readonly [DisplayContent, DisplayContent, DisplayContent]
  items: readonly DisplayDiffItem[]
  /** `inline`: also lists unchanged items, with their value as is. Defaults to `false`. */
  showUnchanged?: boolean
}
