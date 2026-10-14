<script setup lang="ts">
import type { VNodeChild } from 'vue'

import type { FormOptionValueRenderContext, ResolvedFormOption } from '../../types'
import { formOptionKey } from '../../utils/options'
import { mergeFormUiClass } from '../../utils/ui'
import FormOptionToken from './form-option-token.vue'

/**
 * The chosen options of a multiple selection as its closed control shows them: one token each,
 * with the option's icon, avatar or chip before its label, wrapping onto more lines when they do
 * not fit. A token is no taller than a line of text, so one row keeps the control as high as the
 * inputs beside it. The tokens ignore the pointer, so a click still opens the control. They look
 * like the tags of a multiple auto-complete, so both read alike. A visually hidden comma between
 * them keeps the value reading as a list ("Euro, Dollar") for assistive technology.
 */
defineProps<{
  options: readonly ResolvedFormOption[]
  render?: (context: FormOptionValueRenderContext) => VNodeChild
  /** Shown instead of each label, such as the path of a hierarchy option. */
  labelOf?: (option: ResolvedFormOption) => string
  /** Classes of each token. */
  tokenClass?: string
}>()

const TOKEN =
  'inline-flex max-w-full min-w-0 items-center rounded-sm bg-elevated px-1.5 py-0.5 text-xs font-medium text-default ring ring-accented ring-inset'
</script>

<template>
  <span
    class="pointer-events-none flex min-w-0 flex-1 flex-wrap gap-1 text-start"
    data-form-option-tokens
  >
    <template v-for="(option, index) in options" :key="formOptionKey(option.value)">
      <span :class="mergeFormUiClass(TOKEN, tokenClass)" data-form-option-token>
        <FormOptionToken :option="option" :render="render" :label="labelOf?.(option)" />
      </span>
      <span v-if="index < options.length - 1" class="sr-only">, </span>
    </template>
  </span>
</template>
