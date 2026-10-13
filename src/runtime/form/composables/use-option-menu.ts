import { computed } from 'vue'

import type {
  FormAutoCompleteField,
  FormOptionRuntimeState,
  FormOptionValue,
  FormSelectField,
  ResolvedFormOption,
} from '../types'
import { formOptionKey, resolveOptionLeading, toMenuItems } from '../utils/options'

/**
 * What the select and the auto-complete share around the options they list in a Nuxt UI menu: the
 * menu items (grouped when the options carry headings), which option is selected, and the option
 * the closed control shows with its leading visual and its custom value.
 */
export function useOptionMenu(params: {
  field: () => FormSelectField | FormAutoCompleteField
  model: () => FormOptionValue | readonly FormOptionValue[] | null | undefined
  multiple: () => boolean
  options: FormOptionRuntimeState
  loadMoreLabel: () => string
}) {
  const renderOption = computed(() => params.field().renderOption)
  const renderValue = computed(() => params.field().renderValue)
  const items = computed(() =>
    toMenuItems(params.options.items.value, {
      label: params.loadMoreLabel(),
      show:
        params.options.remote.value &&
        (params.options.hasMore.value || params.options.loadingMore.value),
    }),
  )
  const selectedKeys = computed<ReadonlySet<string>>(() => {
    const model = params.model()
    const values = Array.isArray(model) ? model : [model]
    return new Set(
      values.filter((value) => value !== null && value !== undefined).map(formOptionKey),
    )
  })
  /** The chosen option in single selection; multiple selection keeps the labels Nuxt UI joins. */
  const valueOption = computed<ResolvedFormOption | undefined>(() =>
    params.multiple() ? undefined : params.options.selectedItems.value[0],
  )
  /** The chosen option, when its leading visual belongs in the control's leading slot. */
  const leadingOption = computed(() => {
    const option = valueOption.value
    return option && !renderValue.value && resolveOptionLeading(option) ? option : undefined
  })
  /** The chosen option, when the control must draw its value itself. */
  const customValueOption = computed(() => {
    const option = valueOption.value
    return option && (renderValue.value || option.suffix) ? option : undefined
  })

  function isSelected(option: ResolvedFormOption) {
    return selectedKeys.value.has(formOptionKey(option.value))
  }

  return {
    customValueOption,
    isSelected,
    items,
    leadingOption,
    renderOption,
    renderValue,
  }
}
