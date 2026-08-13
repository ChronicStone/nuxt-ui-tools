<script setup lang="ts">
import UModal from '@nuxt/ui/components/Modal.vue'

import type { FormOverlayLayoutEmits, FormOverlayLayoutProps } from '../../types'

defineProps<FormOverlayLayoutProps>()
defineEmits<FormOverlayLayoutEmits>()
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    fullscreen
    :dismissible="dismissible"
    :ui="{
      content: 'h-dvh overflow-hidden p-0 sm:max-w-none sm:rounded-none',
    }"
    @update:open="$emit('update:open', $event)"
    @after:leave="$emit('after-close')"
  >
    <template #content>
      <slot />
    </template>
  </UModal>
</template>
