<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'
import type { VNodeChild } from 'vue'

import type { FormOptionRenderContext, ResolvedFormOption } from '../../types'
import { isLoadMoreOption } from '../../utils/options'
import FormOptionRender from './form-option-render'

/**
 * Label of an option in a menu. The load-more row keeps its own loader, an option with a
 * `renderOption` function shows what it returns, and any other option shows its label.
 */
const props = defineProps<{
  option: ResolvedFormOption
  selected?: boolean
  render?: (context: FormOptionRenderContext) => VNodeChild
}>()

const loadMore = computed(() => isLoadMoreOption(props.option))

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
  <span
    v-if="loadMore"
    class="flex items-center gap-2 text-xs text-muted"
    data-form-option-loading=""
  >
    <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" aria-hidden="true" />
    {{ option.label }}
  </span>
  <span v-else-if="render" class="block whitespace-normal" data-form-option-custom>
    <FormOptionRender :content="content" />
  </span>
  <template v-else>{{ option.label }}</template>
</template>
