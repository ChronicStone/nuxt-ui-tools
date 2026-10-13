import { computed } from 'vue'

import { useResponsiveValue } from '../../../shared/composables/use-responsive-value'
import type { FormControlUi } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'
import { CARD_SELECTED_RING } from '../card-selection'
import type { ChoiceCardKind, ChoiceCardLayout, ChoiceCardMark, FormChoiceCardProps } from './types'

/** Props the card fields render themselves, kept away from the Nuxt UI group. */
export const CHOICE_CARD_PROPS = [
  'columns',
  'density',
  'groupKey',
  'icon',
  'indicator',
  'orientation',
]

interface ChoiceCardLayoutUi {
  /** Gap between the cards. */
  gap: string
  item?: string
  label?: string
  wrapper?: string
}

/**
 * What each layout changes in the Nuxt UI slots. `inline` puts the icon before the label and
 * `stacked` puts its tile above it. `compact` makes the label a two-column grid (icon or tile,
 * then the title over a one-line description) in a smaller card. Nuxt UI centers the wrapper of a
 * card with a hidden indicator, so the compact wrapper stretches the label across the card: its
 * content starts at the card edge whatever its length.
 */
const LAYOUT_UI: Record<ChoiceCardLayout, ChoiceCardLayoutUi> = {
  compact: {
    gap: 'gap-2',
    item: 'items-center p-2.5',
    label: 'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center',
    wrapper: 'min-w-0 items-stretch',
  },
  inline: { gap: 'gap-2.5' },
  stacked: {
    gap: 'gap-2.5',
    label: 'flex flex-col items-start gap-2.5 font-semibold',
    wrapper: 'flex flex-col items-start gap-1.5',
  },
}

/**
 * What each group does with its Nuxt UI `icon` slot. A radio group draws a copy of the option icon
 * next to the card content, which draws the icon itself: that copy stays hidden. A checkbox group
 * draws its check mark with the same slot and its items carry no icon, so it stays visible.
 */
const ICON_UI: Record<ChoiceCardKind, string | undefined> = {
  checkbox: undefined,
  radio: 'hidden',
}

/**
 * Presentation of a radio or checkbox card group: the flowing row or fixed grid of cards, the
 * selection mark, where option icons go, the density, and the headings of grouped options.
 * Returns the props and `ui` slots for the Nuxt UI group, and what the card content renders
 * (`compact`, `tile`, `mark`).
 */
export function useChoiceCard(params: {
  kind: ChoiceCardKind
  props: () => FormChoiceCardProps
  ui: () => FormControlUi | undefined
}) {
  const columnsValue = useResponsiveValue(() => String(params.props().columns ?? ''))
  const columns = computed(() => {
    const count = Math.trunc(Number(columnsValue.value))
    return count > 0 ? count : undefined
  })
  const mark = computed<ChoiceCardMark>(() => {
    const value = params.props().indicator
    return value === 'corner' || value === 'switch' ? value : 'none'
  })
  const compact = computed(() => params.props().density === 'compact')
  const tile = computed(() => params.props().icon === 'tile')
  const layout = computed<ChoiceCardLayout>(() => {
    if (compact.value) return 'compact'
    return tile.value ? 'stacked' : 'inline'
  })
  const indicator = computed(() => {
    const value = params.props().indicator
    return value === 'corner' || value === 'switch' ? 'hidden' : value
  })
  const orientation = computed(() => params.props().orientation)
  /** Sets the column count the grid template reads. */
  const style = computed(() =>
    columns.value ? { '--nut-choice-columns': String(columns.value) } : undefined,
  )
  const ui = computed<FormControlUi>(() => {
    const current = params.ui()
    const layoutUi = LAYOUT_UI[layout.value]
    const stacked = layout.value === 'stacked'
    return {
      ...current,
      fieldset: mergeFormUiClass(
        columns.value
          ? `grid grid-cols-[repeat(var(--nut-choice-columns),minmax(0,1fr))] ${layoutUi.gap}`
          : `${layoutUi.gap}${orientation.value === 'horizontal' ? ' flex-wrap' : ''}`,
        current?.fieldset,
      ),
      item: mergeFormUiClass(
        `border-default ${CARD_SELECTED_RING} ${layoutUi.item ?? ''}`,
        mark.value === 'none' ? undefined : 'relative',
        current?.item,
      ),
      icon: mergeFormUiClass(ICON_UI[params.kind], current?.icon),
      // The heading of a group of options, set above its cards.
      legend: mergeFormUiClass('mb-2 text-sm font-medium text-muted', current?.legend),
      label: mergeFormUiClass(layoutUi.label, current?.label),
      // A hidden indicator centers the text: keep it aligned, and clear of an inline corner check.
      wrapper: mergeFormUiClass(
        layoutUi.wrapper,
        [
          indicator.value === 'hidden' ? 'ms-0 text-start' : '',
          mark.value === 'corner' && !stacked ? 'pe-7' : '',
          mark.value === 'switch' && !stacked ? 'pe-12' : '',
        ].join(' '),
        current?.wrapper,
      ),
    }
  })
  /** Stack of the groups when the options are grouped; `ui.groups` restyles it. */
  const groupsClass = computed(() => mergeFormUiClass('flex flex-col gap-5', params.ui()?.groups))

  return { compact, groupsClass, indicator, mark, orientation, style, tile, ui }
}
