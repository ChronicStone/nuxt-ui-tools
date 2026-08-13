<script setup lang="ts">
import UPopover from '@nuxt/ui/components/Popover.vue'

const props = defineProps<{
  open: boolean
  embedded?: boolean
  contentClass?: string
  transitioning?: boolean
}>()

const emit = defineEmits<{
  updateOpen: [value: boolean]
}>()

function handleFocusOutside(event: Event) {
  if (props.transitioning) event.preventDefault()
}
</script>

<template>
  <template v-if="embedded">
    <slot name="content" />
  </template>
  <UPopover
    v-else
    :open="open"
    :content="{
      side: 'bottom',
      align: 'start',
      sideOffset: 8,
      onFocusOutside: handleFocusOutside,
    }"
    :ui="{ content: contentClass }"
    @update:open="emit('updateOpen', $event)"
  >
    <slot />
    <template #content>
      <slot name="content" />
    </template>
  </UPopover>
</template>
