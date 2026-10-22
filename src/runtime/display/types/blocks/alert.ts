import type { DisplayAction, DisplayBlockBase, DisplayContent, DisplayTone } from '../shared'

export type DisplayAlertAppearance =
  | 'soft'
  | 'outline'
  | 'subtle'
  | 'solid'
  | 'callout'
  | 'inline'
  | 'banner'

export type DisplayAlertSlot =
  | 'root'
  | 'icon'
  | 'body'
  | 'title'
  | 'message'
  | 'items'
  | 'item'
  | 'itemIcon'
  | 'list'
  | 'toggle'
  | 'details'
  | 'actions'

export interface DisplayAlertItem {
  /** Defaults to the alert icon. */
  icon?: string
  text: DisplayContent
}

export interface DisplayAlertProps extends DisplayBlockBase<DisplayAlertSlot> {
  /** Defaults to `info`. */
  tone?: DisplayTone
  /**
   * `soft`, `outline`, `subtle` and `solid` box the notice; `callout` draws an accent bar,
   * `inline` drops the box, and `banner` sets the icon in a tile with the actions at the end.
   * Defaults to `soft`.
   */
  appearance?: DisplayAlertAppearance
  /** Defaults to the tone's icon from `appConfig.ui.icons`; `false` hides it. */
  icon?: string | false
  title?: DisplayContent
  message?: DisplayContent
  /** Lines led by their own icon. */
  items?: readonly DisplayAlertItem[]
  /** Bulleted lines. */
  list?: readonly DisplayContent[]
  /** Folded text revealed by a "Show details" toggle. */
  details?: DisplayContent
  /** Opens `details` initially. */
  defaultOpen?: boolean
  actions?: readonly DisplayAction[]
}
