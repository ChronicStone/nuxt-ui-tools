import type { FormOption, FormOptionValue } from '../../types/options'
import type { FormText } from '../../types/utils'

/** Size of the cards: `compact` packs long option lists into smaller, single-row cards. */
export type FormChoiceCardDensity = 'default' | 'compact'

/**
 * Presentation of the radio and checkbox cards.
 *
 * @example
 * ```ts
 * // A fixed grid of cards, each with its icon in a tile above the label and a check in the
 * // corner once selected.
 * props: { columns: '1 md:2 lg:3', icon: 'tile', indicator: 'corner' }
 *
 * // Eight options in four groups, as smaller cards with the icon beside a one-line label.
 * props: { columns: '1 md:2', density: 'compact', icon: 'tile', indicator: 'corner' }
 * ```
 */
export interface FormChoiceCardProps {
  /**
   * Lays the cards out in a fixed grid of this many equal columns. Accepts breakpoints:
   * `3` or `'1 md:2 lg:3'`. Without it, cards flow along `orientation`.
   */
  columns?: number | string
  /** Direction of the cards when they are not in a `columns` grid. */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Selection mark: the radio or checkbox before the content (`start`, the default), after it
   * (`end`), none (`hidden`), a check in the top corner of the selected cards (`corner`), or a
   * switch in the top corner of every card that turns on with the selection (`switch`), for cards
   * that enable something.
   */
  indicator?: 'start' | 'end' | 'hidden' | 'corner' | 'switch'
  /**
   * Where an option's `icon` shows: before its label (`inline`, the default), or in a tile above
   * it (`tile`) that takes the selection color, beside the label in the `compact` density. Style the parts the engine renders with the
   * `ui` slots `tile`, `tileIcon`, `optionIcon`, `check`, `checkIcon`, `switch`, and
   * `switchThumb`, next to the Nuxt UI slots of the group. The tile and the switch carry the
   * option value as `data-value`, so one option can take its own colors.
   */
  icon?: 'inline' | 'tile'
  /**
   * Size of the cards. `compact` shrinks the padding and tile, puts the icon beside the label
   * instead of above it, and keeps the title and the description on one line each, truncated with
   * an ellipsis (the full description stays in the card's tooltip). Defaults to `default`.
   */
  density?: FormChoiceCardDensity
}

/**
 * Option of a radio or checkbox card: the shared option shape plus the icon and the heading the
 * cards can show.
 */
export interface FormChoiceCardOption<
  TValue extends FormOptionValue = FormOptionValue,
> extends FormOption<TValue> {
  /** Icon shown with the label, inline or in a tile (see `props.icon`). */
  icon?: string
  /**
   * Heading this option is listed under. Options sharing a heading are listed together, and the
   * headings follow the order in which they first appear in the options. Options without one
   * stay together, without a heading.
   */
  group?: FormText
}

/** Authored option item accepted by radio and checkbox cards. */
export type FormChoiceCardOptionItem<TValue extends FormOptionValue = FormOptionValue> =
  | TValue
  | FormChoiceCardOption<TValue>

/** The card layouts: icon before the label, icon tile above it, or one compact row. */
export type ChoiceCardLayout = 'inline' | 'stacked' | 'compact'

/** The mark a card draws itself, in place of the Nuxt UI indicator. */
export type ChoiceCardMark = 'corner' | 'switch' | 'none'
