<script setup lang="ts">
import type { VNodeChild } from 'vue'

import type { FormOptionValueRenderContext, ResolvedFormOption } from '../../types'
import FormOptionRender from './form-option-render'
import FormOptionSuffix from './form-option-suffix.vue'

/**
 * The chosen option as the closed control of a select or auto-complete reads: what `renderValue`
 * returns, or the label followed by the dimmed suffix. The leading visual belongs to the control's
 * own leading slot.
 */
const props = defineProps<{
  option: ResolvedFormOption
  render?: (context: FormOptionValueRenderContext) => VNodeChild
}>()

function content() {
  const { item } = props.option
  return item === undefined ? null : props.render?.({ item, option: props.option })
}
</script>

<template>
  <FormOptionRender v-if="render" :content="content" />
  <template v-else>
    {{ option.label }}
    <FormOptionSuffix :option="option" class="ms-1.5" />
  </template>
</template>
