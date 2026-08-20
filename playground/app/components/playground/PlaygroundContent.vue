<script setup lang="ts">
import type { PlaygroundContentMode } from '../../types/playground'

const props = withDefaults(
  defineProps<{
    mode?: PlaygroundContentMode
    class?: string
  }>(),
  {
    mode: 'document',
  },
)

const modeClasses = {
  document: 'h-full overflow-y-auto overscroll-contain',
  fixed: 'h-full min-h-0 overflow-hidden',
  scroll: 'h-full min-h-0 overflow-y-auto overscroll-contain',
  canvas: 'h-full min-h-0 overflow-hidden',
} satisfies Record<PlaygroundContentMode, string>
</script>

<template>
  <div :class="[modeClasses[props.mode], props.class]" :data-playground-content-mode="props.mode">
    <slot />
  </div>
</template>
