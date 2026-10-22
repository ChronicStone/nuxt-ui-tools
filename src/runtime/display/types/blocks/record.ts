import type {
  DisplayAvatar,
  DisplayBlockBase,
  DisplayChip,
  DisplayContent,
  DisplayRevealable,
  DisplaySurface,
  DisplayTone,
} from '../shared'

export type DisplayRecordSlot =
  | 'root'
  | 'media'
  | 'icon'
  | 'body'
  | 'reference'
  | 'title'
  | 'meta'
  | 'description'
  | 'badges'
  | 'trailing'
  | 'trailingValue'
  | 'trailingCaption'
  | 'header'
  | 'list'
  | 'item'
  | 'more'
  | 'empty'

export interface DisplayRecordItem {
  /** Small reference over the title, such as an identifier. */
  reference?: DisplayContent
  title: DisplayContent
  meta?: DisplayContent
  metaIcon?: string
  /** `card` text under the title, clamped to two lines. */
  description?: DisplayContent
  /** A missing or broken `src` shows a placeholder tile. */
  image?: { src?: string | null; alt?: string }
  avatar?: DisplayAvatar
  /** Icon tile, used when there is no image or avatar. */
  icon?: string
  tone?: DisplayTone
  badges?: readonly DisplayChip[]
  /** Text at the end of the row, such as a price. */
  trailing?: DisplayContent
  trailingCaption?: DisplayContent
  /** Badge at the end of the row. */
  chip?: DisplayChip
  /** Makes the record a link. */
  to?: string
  onClick?: () => void
}

export interface DisplayRecordProps
  extends DisplayBlockBase<DisplayRecordSlot>, Partial<DisplayRecordItem>, DisplayRevealable {
  /**
   * `row` and `card` show one record, `compact` is a slim row with an icon tile, and `stack` lists
   * `items` under a heading. Defaults to `row`.
   */
  variant?: 'row' | 'card' | 'compact' | 'stack'
  /** `stack` heading. */
  heading?: DisplayContent
  headingIcon?: string
  items?: readonly DisplayRecordItem[]
  /** Defaults to `bordered`. */
  surface?: DisplaySurface
}
