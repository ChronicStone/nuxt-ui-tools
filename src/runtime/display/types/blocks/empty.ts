import type { DisplayAction, DisplayBlockBase, DisplayContent, DisplayTone } from '../shared'

export type DisplayEmptySlot = 'root' | 'icon' | 'title' | 'description' | 'actions'

export interface DisplayEmptyProps extends DisplayBlockBase<DisplayEmptySlot> {
  /** `dashed` is a centred box with actions, `plain` a single quiet line. Defaults to `dashed`. */
  variant?: 'dashed' | 'plain'
  /** Defaults to `appConfig.ui.icons.folder`. */
  icon?: string
  title?: DisplayContent
  description?: DisplayContent
  actions?: readonly DisplayAction[]
  /** Tint of the icon tile. Defaults to `neutral`. */
  tone?: DisplayTone
}
