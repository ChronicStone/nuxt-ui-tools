import type {
  DisplayBlockBase,
  DisplayContent,
  DisplayRevealable,
  DisplayText,
  DisplayTone,
  DisplayUrl,
} from '../shared'

export type DisplayListVariant =
  | 'bullets'
  | 'numbered'
  | 'icons'
  | 'checks'
  | 'steps'
  | 'columns'
  | 'files'
  | 'chips'

export type DisplayListSlot =
  | 'root'
  | 'title'
  | 'list'
  | 'item'
  | 'marker'
  | 'text'
  | 'description'
  | 'meta'
  | 'action'
  | 'more'
  | 'empty'

export interface DisplayListItem {
  /** The text, or the file name for `files`. */
  text: DisplayContent
  description?: DisplayContent
  icon?: string
  tone?: DisplayTone
  /** `checks` and `steps`: done. */
  done?: boolean
  /** `steps`: the current step. */
  current?: boolean
  /** Text at the end of the item. */
  meta?: DisplayContent
  /** `chips`: tooltip of the chip. */
  tooltip?: DisplayText
  /** `files`: link of the file, or a function returning it, opened in the file preview or a new tab. */
  href?: DisplayUrl
  /** `files`: name used for the type badge. Defaults to `text` when it is a string. */
  name?: string
  /** `files`: size in bytes. */
  size?: number
  /** `files`: MIME type. */
  type?: string
}

export interface DisplayListProps extends DisplayBlockBase<DisplayListSlot>, DisplayRevealable {
  /** Defaults to `bullets`. */
  variant?: DisplayListVariant
  title?: DisplayContent
  items: readonly DisplayListItem[]
  /** `columns`: column count. Defaults to `2`. */
  columns?: number
  /** `files`: opens files in the file preview instead of a new tab. Defaults to `true`. */
  preview?: boolean
}
