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
   * (`end`), none (`hidden`), or a check in the top corner of the selected cards (`corner`).
   */
  indicator?: 'start' | 'end' | 'hidden' | 'corner'
  /**
   * Where an option's `icon` shows: before its label (`inline`, the default), or in a tile above
   * it (`tile`) that takes the selection color. Style the parts the engine renders with the
   * `ui` slots `tile`, `tileIcon`, `optionIcon`, `check`, and `checkIcon`, next to the Nuxt UI
   * slots of the group.
   */
  icon?: 'inline' | 'tile'
}
