<script setup lang="ts">
import UDrawer from '@nuxt/ui/components/Drawer.vue'

import type { FormOverlayLayoutEmits, FormOverlayLayoutProps } from '../../types'

defineProps<FormOverlayLayoutProps>()
defineEmits<FormOverlayLayoutEmits>()
</script>

<template>
  <UDrawer
    :open="open"
    :title="title"
    :description="description"
    direction="right"
    :dismissible="dismissible"
    :handle="false"
    :ui="{
      content: 'h-dvh overflow-hidden border-l border-default p-0 md:max-w-xl',
    }"
    @update:open="$emit('update:open', $event)"
    @animation-end="$emit('after-close')"
  >
    <template #content>
      <slot />
    </template>
  </UDrawer>
</template>
