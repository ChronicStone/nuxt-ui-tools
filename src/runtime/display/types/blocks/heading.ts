import type {
  DisplayAction,
  DisplayBlockBase,
  DisplayContent,
  DisplaySize,
  DisplayText,
  DisplayTone,
} from '../shared'

export type DisplayHeadingSlot =
  | 'root'
  | 'icon'
  | 'text'
  | 'title'
  | 'count'
  | 'description'
  | 'action'
  | 'rule'

export interface DisplayHeadingProps extends DisplayBlockBase<DisplayHeadingSlot> {
  title: DisplayContent
  description?: DisplayContent
  /** `eyebrow` is a small uppercase label followed by a rule. Defaults to `title`. */
  variant?: 'title' | 'eyebrow'
  /** Defaults to `md`. At `lg`, the icon sits in a tinted tile. */
  size?: DisplaySize
  icon?: string
  /** Tone of the icon tile. Defaults to `primary`. */
  tone?: DisplayTone
  /** Pill after the title, such as the number of items below. */
  count?: DisplayText
  /** Link-style button at the end of the row. */
  action?: DisplayAction
  /** Heading level of the title element. Defaults to `3`. */
  level?: 2 | 3 | 4 | 5 | 6
}
