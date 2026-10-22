import type { DisplayBlockBase, DisplayText } from '../shared'

export type DisplayCodeSlot = 'root' | 'header' | 'language' | 'body' | 'icon' | 'value' | 'actions'

export interface DisplayCodeProps extends DisplayBlockBase<DisplayCodeSlot> {
  /** `block` is a code panel, `value` a one-line field to copy, `secret` a masked value. Defaults to `block`. */
  variant?: 'block' | 'value' | 'secret'
  value: string
  /** `block` header. `json` is highlighted. */
  language?: string
  /** `block` header text. Defaults to `language`. */
  label?: DisplayText
  /** Icon at the start of `value` and `secret`. */
  icon?: string
  /** Adds a button opening this address. */
  href?: string
  /** Defaults to `true`. */
  copy?: boolean
  /** `secret`: characters left visible at the end. Defaults to `4`. */
  visible?: number
  /** `block`: scrolls past this height (px or CSS length). */
  maxHeight?: number | string
}
