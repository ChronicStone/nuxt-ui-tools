<script setup lang="ts">
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import { computed } from 'vue'

import type { FormDrawerLayoutProps, FormOverlayLayoutEmits } from '../../types'
import { isNumber } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<FormDrawerLayoutProps>()
const emit = defineEmits<FormOverlayLayoutEmits>()
const direction = computed(() => props.config?.placement ?? 'right')
const contentStyle = computed(() => ({
  width: cssSize(props.config?.width),
  height: cssSize(props.config?.height),
  resize: props.config?.resizable
    ? ['top', 'bottom'].includes(direction.value)
      ? 'vertical'
      : 'horizontal'
    : undefined,
}))
const contentProps = computed(() => ({
  disableOutsidePointerEvents: undefined,
  style: contentStyle.value,
}))

function cssSize(value: number | string | undefined) {
  return isNumber(value) ? `${value}px` : value
}

function handleAnimationEnd(open: boolean) {
  if (!open) emit('after-close')
}
</script>

<template>
  <UDrawer
    :open="open"
    :title="title"
    :description="description"
    :direction="direction"
    :dismissible="dismissible && config?.allowOutsideClick !== false"
    :content="contentProps"
    :handle="false"
    :ui="{
      overlay: ui?.overlay,
      content: mergeFormUiClass('h-dvh max-w-full overflow-hidden border-default p-0', ui?.content),
    }"
    @update:open="$emit('update:open', $event)"
    @animation-end="handleAnimationEnd"
  >
    <template #content>
      <slot />
    </template>
  </UDrawer>
</template>
