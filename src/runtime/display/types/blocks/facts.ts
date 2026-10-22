import type {
  DisplayAction,
  DisplayBlockBase,
  DisplayChip,
  DisplayContent,
  DisplaySurface,
  DisplayTone,
} from '../shared'

export type DisplayFactsLayout = 'ledger' | 'grid' | 'inline' | 'columns' | 'tiles'

export type DisplayFactsSlot =
  | 'root'
  | 'group'
  | 'groupHeader'
  | 'groupTitle'
  | 'groupAside'
  | 'item'
  | 'label'
  | 'hint'
  | 'value'
  | 'empty'
  | 'actions'

export interface DisplayFact {
  label: DisplayContent
  /** `null`, `undefined` and `''` draw a dash. */
  value?: DisplayContent
  /** Secondary line under the label (`ledger`) or the value (`grid`, `columns`, `tiles`). */
  hint?: DisplayContent
  tone?: DisplayTone
  /** Draws the value as a badge. */
  chip?: DisplayChip
  /** Text copied by a trailing button; `true` copies a text `value`. */
  copy?: string | boolean
  mono?: boolean
  /** Larger, bolder value, such as the amount being confirmed. */
  emphasis?: boolean
  /** Icon before the label. */
  icon?: string
  /** Makes the value a link. */
  to?: string
  /** Draws a placeholder bar instead of the value, such as one figure still loading. */
  loading?: boolean
}

export interface DisplayFactGroup {
  title?: DisplayContent
  /** Text at the end of the group heading. */
  aside?: DisplayContent
  items: readonly DisplayFact[]
}

export interface DisplayFactsProps extends DisplayBlockBase<DisplayFactsSlot> {
  /**
   * `ledger` lists rows with the value at the end, `grid` stacks a caption over each value,
   * `inline` runs the pairs on one line, `columns` sets a label column beside the values, and
   * `tiles` puts each fact in a tinted tile. Defaults to `ledger`.
   */
  layout?: DisplayFactsLayout
  /** Defaults to `bordered` for `ledger`, `plain` otherwise. */
  surface?: DisplaySurface
  items?: readonly DisplayFact[]
  /** Titled groups of facts. Other layouts than `ledger` draw them one after the other. */
  groups?: readonly DisplayFactGroup[]
  /** Columns of `grid` and `tiles`. Defaults to as many as fit. */
  columns?: number
  /** Width of the label column in `columns`. Defaults to `8rem`. */
  labelWidth?: string
  empty?: DisplayContent
  /** Buttons under the facts, such as « Edit the address ». */
  actions?: readonly DisplayAction[]
}
