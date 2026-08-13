<script setup lang="ts">
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import { computed } from 'vue'

import type { FormDrawerLayoutProps, FormOverlayLayoutEmits } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<FormDrawerLayoutProps>()
defineEmits<FormOverlayLayoutEmits>()
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

function cssSize(value: number | string | undefined) {
  return typeof value === 'number' ? `${value}px` : value
}
</script>

<template>
  <UDrawer
    :open="open"
    :title="title"
    :description="description"
    :direction="direction"
    :dismissible="dismissible && config?.allowOutsideClick !== false"
    :style="contentStyle"
    :handle="false"
    :ui="{
      overlay: ui?.overlay,
      content: mergeFormUiClass(
        'h-dvh overflow-hidden border-l border-default p-0 md:max-w-xl',
        ui?.content,
      ),
    }"
    @update:open="$emit('update:open', $event)"
    @animation-end="$emit('after-close')"
  >
    <template #content>
      <slot />
    </template>
  </UDrawer>
</template>
