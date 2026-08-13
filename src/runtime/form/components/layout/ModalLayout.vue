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
    :dismissible="dismissible"
    :ui="{
      content: 'flex max-h-[85dvh] min-h-0 overflow-hidden border border-default p-0 sm:max-w-4xl',
    }"
    @update:open="$emit('update:open', $event)"
    @after:leave="$emit('after-close')"
  >
    <template #content>
      <slot />
    </template>
  </UModal>
</template>
