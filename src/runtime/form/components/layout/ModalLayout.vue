<script setup lang="ts">
import UModal from '@nuxt/ui/components/Modal.vue'
import { computed } from 'vue'

import type { FormModalLayoutProps, FormOverlayLayoutEmits } from '../../types'
import { isNumber } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<FormModalLayoutProps>()
defineEmits<FormOverlayLayoutEmits>()
const contentStyle = computed(() => ({
  maxWidth: cssSize(props.config?.maxWidth),
  maxHeight: cssSize(props.config?.maxHeight),
}))
const contentProps = computed(() => ({
  disableOutsidePointerEvents: undefined,
  style: contentStyle.value,
}))

function cssSize(value: number | string | undefined) {
  return isNumber(value) ? `${value}px` : value
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    :dismissible="dismissible && config?.allowOutsideClick !== false"
    :content="contentProps"
    :ui="{
      overlay: ui?.overlay,
      content: mergeFormUiClass(
        'flex max-h-[85dvh] min-h-0 overflow-hidden border border-default p-0 sm:max-w-4xl',
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
