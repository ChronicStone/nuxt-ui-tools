import type { DisplaySpec } from '../registry'
import type { DisplayBlockBase, DisplayContent } from '../shared'

export type DisplayAccordionSlot =
  | 'root'
  | 'item'
  | 'trigger'
  | 'icon'
  | 'label'
  | 'chevron'
  | 'content'

export interface DisplayAccordionItem {
  label: DisplayContent
  icon?: string
  content?: DisplayContent
  /** A display block drawn as the content, such as `{ display: 'facts', props: { ... } }`. */
  block?: DisplaySpec
  defaultOpen?: boolean
}

export interface DisplayAccordionProps extends DisplayBlockBase<DisplayAccordionSlot> {
  /** `separated` boxes each item, `flush` separates them with rules. Defaults to `separated`. */
  variant?: 'separated' | 'flush'
  items: readonly DisplayAccordionItem[]
  /** Lets several items stay open. Defaults to `false`. */
  multiple?: boolean
}
