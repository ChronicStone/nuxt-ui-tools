import type {
  DisplayAvatar,
  DisplayBlockBase,
  DisplayContent,
  DisplayDate,
  DisplayRevealable,
  DisplayText,
  DisplayTone,
} from '../shared'

export type DisplayTimelineState = 'done' | 'current' | 'upcoming'

export type DisplayTimelineSlot =
  | 'root'
  | 'item'
  | 'marker'
  | 'connector'
  | 'body'
  | 'title'
  | 'time'
  | 'description'
  | 'actor'
  | 'now'
  | 'more'
  | 'empty'

export interface DisplayTimelineItem {
  title: DisplayContent
  description?: DisplayContent
  /** Orders `schedule` items against `now` and fills `time` when it is not set. */
  date?: DisplayDate
  /** Text of the time, such as `12 oct.`. Defaults to the formatted `date`. */
  time?: DisplayText
  icon?: string
  /** Defaults to `neutral`. */
  tone?: DisplayTone
  actor?: { name: DisplayText; avatar?: DisplayAvatar }
  /** Defaults from `date` against `now` when there is a date, `done` otherwise. */
  state?: DisplayTimelineState
}

export interface DisplayTimelineProps
  extends DisplayBlockBase<DisplayTimelineSlot>, DisplayRevealable {
  /**
   * `vertical` lists events with dots, `log` is a dense list with times and actors, `pipeline`
   * draws stages in a row, and `schedule` lists planned events with a "today" marker.
   * Defaults to `vertical`.
   */
  variant?: 'vertical' | 'log' | 'pipeline' | 'schedule'
  items: readonly DisplayTimelineItem[]
  /** `pipeline`: index of the current stage, for items without a `state`. */
  current?: number
  /** Defaults to the current time. */
  now?: DisplayDate
  /** `schedule` marker text. Defaults to "Today" and the date. */
  nowLabel?: DisplayText
  /** Format of the times built from dates. Defaults to day and short month, plus the time in `log`. */
  dateFormat?: Intl.DateTimeFormatOptions
}
