<script setup lang="ts">
import type { VNodeChild } from 'vue'
import { nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'

import type { FormOptionValueRenderContext, ResolvedFormOption } from '../../types'
import FormOptionDisplayValue from './form-option-display-value.vue'

/**
 * Draws the chosen option of an auto-complete over the text of its input, while the field rests.
 * The input holds plain text, so a `renderValue` result or a suffix after the label can only sit
 * on top of it: the input keeps its own text (made transparent by the field while `active`), its
 * selection and its focus, and the overlay copies the input's padding and type so the value starts
 * where the text would. It ignores the pointer, and is hidden from assistive technology because
 * the input already announces the label.
 */
const props = defineProps<{
  /** The chosen option, or none. */
  option?: ResolvedFormOption
  render?: (context: FormOptionValueRenderContext) => VNodeChild
  /** True while the overlay stands in for the text of the input. */
  active: boolean
}>()

const root = useTemplateRef<HTMLElement>('root')
const inset = ref<Record<string, string>>({})

function measure() {
  const input = root.value?.querySelector('input')
  if (!input) return
  const style = getComputedStyle(input)
  inset.value = {
    fontSize: style.fontSize,
    insetInlineEnd: style.paddingInlineEnd,
    insetInlineStart: style.paddingInlineStart,
    lineHeight: style.lineHeight,
  }
}

onMounted(measure)
// The padding follows the leading visual and the control size, which change with the option.
watch(
  () => [props.option?.value, props.active],
  () => nextTick(measure),
)
</script>

<template>
  <div ref="root" class="relative w-full min-w-0">
    <slot />
    <div
      v-if="active && option"
      class="pointer-events-none absolute inset-y-0 flex min-w-0 items-center overflow-hidden whitespace-nowrap text-highlighted"
      :style="inset"
      aria-hidden="true"
      data-form-option-value-overlay
    >
      <span class="min-w-0 truncate">
        <FormOptionDisplayValue :option="option" :render="render" />
      </span>
    </div>
  </div>
</template>
