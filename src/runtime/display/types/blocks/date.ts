import type {
  DisplayBlockBase,
  DisplayContent,
  DisplayDate,
  DisplayText,
  DisplayTone,
} from '../shared'

export type DisplayDateSlot =
  | 'root'
  | 'tile'
  | 'month'
  | 'day'
  | 'weekday'
  | 'body'
  | 'title'
  | 'description'
  | 'bound'
  | 'boundLabel'
  | 'boundValue'
  | 'line'
  | 'duration'
  | 'icon'
  | 'value'
  | 'caption'

export interface DisplayDateProps extends DisplayBlockBase<DisplayDateSlot> {
  /**
   * `tile` draws a calendar leaf beside a title, `range` two dates with the duration between
   * them, and `countdown` the time left until `value` (or past it). Defaults to `tile`.
   */
  variant?: 'tile' | 'range' | 'countdown'
  value: DisplayDate
  /** `range`: the last day. */
  end?: DisplayDate
  title?: DisplayContent
  description?: DisplayContent
  icon?: string
  /** Tile header and countdown tone. A countdown defaults to its urgency. */
  tone?: DisplayTone
  /** Adds the time to the formatted dates. */
  time?: boolean
  /** `countdown`: a passed date reads as overdue. Defaults to `true`. */
  deadline?: boolean
  /** `countdown`: days left from which it turns to `warning`. Defaults to `3`. */
  warnWithin?: number
  /** Defaults to the current time. */
  now?: DisplayDate
  /** `countdown`: replaces the computed "In 2 days". */
  label?: DisplayText
}
