import type {
  DisplayBlockBase,
  DisplayChip,
  DisplayContent,
  DisplaySurface,
  DisplayTone,
} from '../shared'

export type DisplayBreakdownSlot =
  | 'root'
  | 'title'
  | 'header'
  | 'headerCell'
  | 'line'
  | 'label'
  | 'detail'
  | 'value'
  | 'total'
  | 'totalLabel'
  | 'totalValue'
  | 'toggle'
  | 'body'
  | 'footnote'

export interface DisplayBreakdownLine {
  label: DisplayContent
  value?: DisplayContent
  /** `compare` mode: the figure of each column. */
  values?: readonly [DisplayContent, DisplayContent]
  /** Secondary figure after the label, such as `24 × 96,00 €` or a rate. */
  detail?: DisplayContent
  /** Bold line after a rule, such as a subtotal. */
  subtotal?: boolean
  /** Ink of the value, such as `success` for a discount. */
  tone?: DisplayTone
  /** Dims the line, such as a discount that does not apply yet. */
  muted?: boolean
}

export interface DisplayBreakdownTotal extends DisplayBreakdownLine {
  chip?: DisplayChip
}

export interface DisplayBreakdownProps extends DisplayBlockBase<DisplayBreakdownSlot> {
  /**
   * `open` lists every line, `collapsible` shows the total until it is unfolded, `compare` sets two
   * columns side by side. Defaults to `open`.
   */
  mode?: 'open' | 'collapsible' | 'compare'
  title?: DisplayContent
  lines: readonly DisplayBreakdownLine[]
  total?: DisplayBreakdownTotal
  /** `compare` column headings. */
  columns?: readonly [DisplayContent, DisplayContent]
  footnote?: DisplayContent
  /** `collapsible` only: starts unfolded. */
  defaultOpen?: boolean
  /** Defaults to `bordered`. */
  surface?: DisplaySurface
}
