<script setup lang="ts">
import UModal from '@nuxt/ui/components/Modal.vue'

import type { FormFullscreenLayoutProps, FormOverlayLayoutEmits } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

defineProps<FormFullscreenLayoutProps>()
defineEmits<FormOverlayLayoutEmits>()
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    fullscreen
    :dismissible="dismissible && config?.allowOutsideClick !== false"
    :ui="{
      overlay: ui?.overlay,
      content: mergeFormUiClass(
        'h-dvh overflow-hidden p-0 sm:max-w-none sm:rounded-none',
        ui?.content,
      ),
    }"
    @update:open="$emit('update:open', $event)"
    @after:leave="$emit('after-close')"
  >
    <template #content>
      <slot />
    </template>
  </UModal>
</template>
