/**
 * Presentation of the radio and checkbox cards.
 *
 * @example
 * ```ts
 * // A fixed grid of cards, each with its icon in a tile above the label and a check in the
 * // corner once selected.
 * props: { columns: '1 md:2 lg:3', icon: 'tile', indicator: 'corner' }
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
   * it (`tile`) that takes the selection color. Style the parts the engine renders with the
   * `ui` slots `tile`, `tileIcon`, `optionIcon`, `check`, `checkIcon`, `switch`, and
   * `switchThumb`, next to the Nuxt UI slots of the group. The tile and the switch carry the
   * option value as `data-value`, so one option can take its own colors.
   */
  icon?: 'inline' | 'tile'
}

/** The mark a card draws itself, in place of the Nuxt UI indicator. */
export type ChoiceCardMark = 'corner' | 'switch' | 'none'
