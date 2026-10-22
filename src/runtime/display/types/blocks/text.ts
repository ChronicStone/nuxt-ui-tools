import type { DisplayBlockBase, DisplayContent, DisplayTone } from '../shared'

export type DisplayTextAppearance =
  | 'body'
  | 'lead'
  | 'muted'
  | 'caption'
  | 'quote'
  | 'legal'
  | 'prose'

export type DisplayTextSlot =
  | 'root'
  | 'header'
  | 'icon'
  | 'title'
  | 'paragraph'
  | 'footer'
  | 'toggle'

export interface DisplayTextProps extends DisplayBlockBase<DisplayTextSlot> {
  /** Defaults to `body`. `prose` styles rich content: links, lists, bold, inline code. */
  appearance?: DisplayTextAppearance
  text?: DisplayContent
  /** Several paragraphs, drawn after `text`. */
  paragraphs?: readonly DisplayContent[]
  /** Heading of a `legal` block. */
  title?: DisplayContent
  /** Icon before the `legal` title or the `caption` text. */
  icon?: string
  /** `quote` attribution, such as the author's name. */
  author?: DisplayContent
  /** Second part of the attribution line, such as a date. */
  meta?: DisplayContent
  /** Accent of the `quote` bar and the `legal` rule. Defaults to `primary` and `neutral`. */
  tone?: DisplayTone
  /** Clamps the text to this many lines with a "Read more" toggle when it overflows. */
  maxLines?: number
}
