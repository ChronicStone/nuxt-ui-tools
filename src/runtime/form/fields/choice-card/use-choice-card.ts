import { computed } from 'vue'

import { useResponsiveValue } from '../../../shared/composables/use-responsive-value'
import type { FormControlUi } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'
import { CARD_SELECTED_RING } from '../card-selection'
import type { ChoiceCardMark, FormChoiceCardProps } from './types'

/** Props the card fields render themselves, kept away from the Nuxt UI group. */
export const CHOICE_CARD_PROPS = ['columns', 'icon', 'indicator', 'orientation']

/**
 * Presentation of a radio or checkbox card group: the flowing row or fixed grid of cards, the
 * selection mark, and where option icons go. Returns the props and `ui` slots for the Nuxt UI
 * group, and what the card content renders (`tile`, `mark`).
 */
export function useChoiceCard(params: {
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
  const tile = computed(() => params.props().icon === 'tile')
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
    return {
      ...current,
      fieldset: mergeFormUiClass(
        columns.value
          ? 'grid grid-cols-[repeat(var(--nut-choice-columns),minmax(0,1fr))] gap-2.5'
          : `gap-2.5${orientation.value === 'horizontal' ? ' flex-wrap' : ''}`,
        current?.fieldset,
      ),
      item: mergeFormUiClass(
        `border-default ${CARD_SELECTED_RING}`,
        mark.value === 'none' ? undefined : 'relative',
        current?.item,
      ),
      // The card label renders the option icon itself (inline or as a tile): Nuxt UI's own copy
      // would show it twice.
      icon: mergeFormUiClass('hidden', current?.icon),
      // A tile stacks above the title, and the description below it, with gaps.
      label: mergeFormUiClass(
        tile.value ? 'flex flex-col items-start gap-2.5 font-semibold' : undefined,
        current?.label,
      ),
      // A hidden indicator centers the text: keep it aligned, and clear of an inline corner check.
      wrapper: mergeFormUiClass(
        tile.value ? 'flex flex-col items-start gap-1.5' : undefined,
        [
          indicator.value === 'hidden' ? 'ms-0 text-start' : '',
          mark.value === 'corner' && !tile.value ? 'pe-7' : '',
          mark.value === 'switch' && !tile.value ? 'pe-12' : '',
        ].join(' '),
        current?.wrapper,
      ),
    }
  })

  return { indicator, mark, orientation, style, tile, ui }
}
