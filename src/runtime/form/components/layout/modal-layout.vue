<script setup lang="ts">
import UModal from '@nuxt/ui/components/Modal.vue'
import { computed } from 'vue'

import type { FormModalLayoutProps, FormOverlayLayoutEmits } from '../../types'
import { isNumber } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<FormModalLayoutProps>()
defineEmits<FormOverlayLayoutEmits>()
const MODAL_SIZES = { lg: 760, md: 600, xl: 920 } as const

const contentStyle = computed(() => ({
  maxHeight: cssSize(props.config?.maxHeight) ?? 'calc(100dvh - 48px)',
  maxWidth: cssSize(props.config?.maxWidth) ?? `${MODAL_SIZES[props.config?.size ?? 'md']}px`,
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
      overlay: mergeFormUiClass('bg-(--nut-form-veil) backdrop-blur-[2px]', ui?.overlay),
      content: mergeFormUiClass(
        'flex min-h-0 w-[calc(100%-40px)] overflow-hidden rounded-[14px] border border-default p-0 shadow-[0_30px_80px_-30px_rgba(31,29,26,0.45),0_2px_6px_rgba(31,29,26,0.06)] sm:max-w-none',
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
