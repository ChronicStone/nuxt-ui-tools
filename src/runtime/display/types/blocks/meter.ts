import type {
  DisplayBlockBase,
  DisplayContent,
  DisplaySize,
  DisplayText,
  DisplayTone,
} from '../shared'

export type DisplayMeterSlot =
  | 'root'
  | 'header'
  | 'label'
  | 'value'
  | 'track'
  | 'bar'
  | 'caption'
  | 'legend'
  | 'legendItem'
  | 'ring'
  | 'parts'
  | 'levels'
  | 'level'
  | 'levelCaption'

export interface DisplayMeterPart {
  label: DisplayContent
  value: number
  /** Text shown for the value. Defaults to the number. */
  valueLabel?: DisplayContent
  tone?: DisplayTone
  icon?: string
  /** `ring` parts: the maximum of this part's own bar. Defaults to the meter `max`. */
  max?: number
}

export interface DisplayMeterLevel {
  label: DisplayText
  caption?: DisplayText
}

export interface DisplayMeterProps extends DisplayBlockBase<DisplayMeterSlot> {
  /**
   * `bar` fills one track, `segments` stacks `parts` in one track with a legend, `split` shares
   * the track between two `parts` labelled at both ends, `ring` draws a circular gauge with
   * `parts` as small bars beside it, and `scale` highlights the `current` of discrete `levels`.
   * Defaults to `bar`.
   */
  variant?: 'bar' | 'segments' | 'split' | 'ring' | 'scale'
  label?: DisplayContent
  value?: number
  /** Defaults to `100`, or to the sum of the parts for `segments` and `split`. */
  max?: number
  /** Text shown for the value. Defaults to `value / max`. */
  valueLabel?: DisplayContent
  /** Defaults to `primary`, unless `thresholds` pick another. */
  tone?: DisplayTone
  /** Switches the tone once the filled share reaches these percentages. */
  thresholds?: { warning?: number; error?: number }
  parts?: readonly DisplayMeterPart[]
  caption?: DisplayContent
  /** `scale` levels, lowest first. */
  levels?: readonly (DisplayText | DisplayMeterLevel)[]
  /** `scale`: index of the reached level. */
  current?: number
  /** `scale`: index of the level aimed for, drawn dashed. */
  target?: number
  /** `ring` diameter. Defaults to `md`. */
  size?: DisplaySize
}
