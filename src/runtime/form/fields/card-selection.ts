export const CARD_SELECTED_RING =
  'has-data-[state=checked]:ring-4 has-data-[state=checked]:ring-primary/20'

/**
 * Classes of a card that carries a `tone`, next to the `nut-display-tone-<tone>` class that points
 * the `--nut-tone*` variables at that tone: once selected, its border, ring and background take
 * the tone in place of `primary`.
 */
export const CARD_TONED_ITEM =
  'has-data-[state=checked]:border-(color:--nut-tone) has-data-[state=checked]:ring-(color:--nut-tone-soft) has-data-[state=checked]:bg-[color-mix(in_oklab,var(--nut-tone)_6%,var(--ui-bg))]'
