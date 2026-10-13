<script setup lang="ts">
import type { VNodeChild } from 'vue'

import type { FormOptionRenderContext, ResolvedFormOption } from '../../types'
import { resolveOptionLeading } from '../../utils/options'
import FormOptionLeading from './form-option-leading.vue'
import FormOptionRender from './form-option-render'
import FormOptionSuffix from './form-option-suffix.vue'

/**
 * Label of an option in a radio or checkbox list: the leading visual, the label, and the suffix at
 * the end of the row. The description stays with the Nuxt UI group, under the row. An option with a
 * `renderOption` function shows what it returns instead, and a plain option shows its label as it
 * always did.
 */
const props = defineProps<{
  option: ResolvedFormOption
  selected?: boolean
  render?: (context: FormOptionRenderContext) => VNodeChild
}>()

function content() {
  const { item } = props.option
  if (item === undefined) return null
  return props.render?.({
    disabled: props.option.disabled === true,
    item,
    option: props.option,
    selected: props.selected === true,
  })
}
</script>

<template>
  <span v-if="render" class="block whitespace-normal" data-form-option-custom>
    <FormOptionRender :content="content" />
  </span>
  <span
    v-else-if="resolveOptionLeading(option) || option.suffix"
    class="flex min-w-0 items-center gap-2"
    data-form-option-row
  >
    <FormOptionLeading :option="option" />
    <span class="min-w-0 flex-1 break-words">{{ option.label }}</span>
    <FormOptionSuffix :option="option" class="ps-2 font-normal" />
  </span>
  <template v-else>{{ option.label }}</template>
</template>
