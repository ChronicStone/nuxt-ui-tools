import type { DisplayBlockBase, DisplayContent, DisplayText, DisplayTone } from '../shared'

export type DisplayChartSlot =
  | 'root'
  | 'header'
  | 'title'
  | 'aside'
  | 'plot'
  | 'bar'
  | 'axis'
  | 'legend'
  | 'legendItem'
  | 'step'
  | 'stepLabel'
  | 'stepValue'
  | 'stepRate'

export interface DisplayChartDatum {
  label: DisplayText
  value: number
  /** Defaults to the dashboard palette, in order. */
  tone?: DisplayTone
}

export interface DisplayChartProps extends DisplayBlockBase<DisplayChartSlot> {
  /** Defaults to `bars`. `funnel` shows the rate kept from one step to the next. */
  variant?: 'bars' | 'line' | 'donut' | 'funnel'
  title?: DisplayContent
  /** Text at the end of the header, such as a period or a total. */
  aside?: DisplayContent
  data: readonly DisplayChartDatum[]
  /** Formats values in labels and the legend. Defaults to the locale number format. */
  format?: (value: number) => string
  /** Plot height in pixels, for `bars` and `line`. Defaults to `96`. */
  height?: number
  /** `bars`: the bar drawn in the accent color with its value. Defaults to `last`. */
  highlight?: 'last' | 'max' | number | false
  empty?: DisplayContent
}
