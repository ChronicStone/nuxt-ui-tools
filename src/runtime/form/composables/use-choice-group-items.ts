import { computed } from 'vue'

import type { FormControlUi, FormOptionRuntimeState, ResolvedFormOption } from '../types'
import { formOptionKey, resolveOptionDescriptionIndent } from '../utils/options'
import { mergeFormUiClass } from '../utils/ui'

/**
 * Items for the Nuxt UI radio and checkbox groups of a field whose options carry more than a
 * label. The group gets the plain parts of each option only: the leading visual, the suffix and a
 * custom render are drawn in its label slot (`optionOf` finds the resolved option behind a slot
 * item), and the description sits under the label, lined up with it. Nothing else of the option
 * reaches the group, whose own `icon` is the check mark of a checkbox.
 */
export function useChoiceGroupItems<TValue extends string | ResolvedFormOption['value']>(params: {
  /** True when a `renderOption` function owns the content of the options. */
  custom: () => boolean
  options: FormOptionRuntimeState
  ui: () => FormControlUi | undefined
  /** The value the group knows an option by. */
  valueOf: (option: ResolvedFormOption) => TValue
}) {
  const optionByKey = computed(
    () =>
      new Map(params.options.items.value.map((option) => [formOptionKey(option.value), option])),
  )
  const items = computed(() =>
    params.options.items.value.map((option) => {
      const indent = params.custom() ? undefined : resolveOptionDescriptionIndent(option)
      return {
        description: params.custom() ? undefined : option.description,
        disabled: option.disabled,
        label: option.label,
        ui: indent
          ? { description: mergeFormUiClass(params.ui()?.description, indent) }
          : undefined,
        value: params.valueOf(option),
      }
    }),
  )

  /** The resolved option behind a slot item, found by its `formOptionKey`. */
  function optionOf(key: string): ResolvedFormOption {
    return optionByKey.value.get(key) ?? { label: key, value: key }
  }

  return { items, optionOf }
}
