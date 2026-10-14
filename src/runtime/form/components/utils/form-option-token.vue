<script setup lang="ts">
import type { VNodeChild } from 'vue'

import type { FormOptionValueRenderContext, ResolvedFormOption } from '../../types'
import FormOptionLeading from './form-option-leading.vue'
import FormOptionRender from './form-option-render'

/**
 * One chosen option inside a token or a tag: its icon, avatar or chip, then its label, both sized
 * for the small text of a token. A `renderValue` function draws the content instead.
 */
const props = defineProps<{
  option: ResolvedFormOption
  render?: (context: FormOptionValueRenderContext) => VNodeChild
  /** Shown instead of the label, such as the path of a hierarchy option. */
  label?: string
}>()

function content() {
  const { item } = props.option
  return item === undefined ? null : props.render?.({ item, option: props.option })
}
</script>

<template>
  <span class="inline-flex max-w-full min-w-0 items-center gap-1" data-form-option-token-content>
    <FormOptionRender v-if="render && option.item !== undefined" :content="content" />
    <template v-else>
      <FormOptionLeading
        :option="option"
        icon-class="size-3.5 text-muted"
        avatar-size="3xs"
        chip-class="size-3"
        chip-size="sm"
      />
      <span class="min-w-0 truncate">{{ label ?? option.label }}</span>
    </template>
  </span>
</template>
