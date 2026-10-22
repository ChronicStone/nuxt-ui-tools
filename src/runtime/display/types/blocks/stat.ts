import type {
  DisplayBlockBase,
  DisplayChip,
  DisplayContent,
  DisplaySize,
  DisplaySurface,
  DisplayText,
  DisplayTone,
} from '../shared'

export type DisplayStatSlot =
  | 'root'
  | 'label'
  | 'value'
  | 'unit'
  | 'caption'
  | 'status'
  | 'delta'
  | 'sparkline'
  | 'items'
  | 'item'
  | 'itemLabel'
  | 'itemValue'
  | 'itemCaption'

export interface DisplayStatItem {
  label: DisplayContent
  value: DisplayContent
  caption?: DisplayContent
  tone?: DisplayTone
}

export interface DisplayStatDelta {
  /** The change, such as `+12 %`. */
  value: DisplayText
  /** Defaults to `up`. */
  direction?: 'up' | 'down' | 'flat'
  /** Defaults to `success` going up, `error` going down, `neutral` flat. */
  tone?: DisplayTone
}

export interface DisplayStatProps extends DisplayBlockBase<DisplayStatSlot> {
  /**
   * `hero` centres one figure, `price` adds a status line, `row` lines up two to four figures,
   * and `trend` adds a change and a sparkline. Defaults to `hero`.
   */
  variant?: 'hero' | 'price' | 'row' | 'trend'
  label?: DisplayContent
  value?: DisplayContent
  /** Small text after the value, such as `HT`. */
  unit?: DisplayContent
  caption?: DisplayContent
  chip?: DisplayChip
  status?: { icon?: string; text: DisplayContent; tone?: DisplayTone }
  delta?: DisplayStatDelta
  /** Points of the `trend` sparkline, oldest first. */
  trend?: readonly number[]
  /** Figures of `row`. */
  items?: readonly DisplayStatItem[]
  tone?: DisplayTone
  /** Defaults to `md`. */
  size?: DisplaySize
  /** Defaults to `muted` for `hero`, `bordered` for `row`, `plain` otherwise. */
  surface?: DisplaySurface
}
