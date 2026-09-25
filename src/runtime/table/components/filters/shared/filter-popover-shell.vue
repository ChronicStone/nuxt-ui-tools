<script setup lang="ts">
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed } from 'vue'

import { resolveDataListPopoverContentClass } from '../../../utils'

const props = defineProps<{
  open: boolean
  embedded?: boolean
  contentClass?: string
  transitioning?: boolean
}>()
const resolvedContentClass = computed(() =>
  resolveDataListPopoverContentClass('fit', props.contentClass),
)

const emit = defineEmits<{
  updateOpen: [value: boolean]
}>()

function focusContent(event: Event) {
  const scope = event.target instanceof HTMLElement ? event.target : null
  const dialog =
    scope?.closest<HTMLElement>('[role="dialog"]') ?? scope?.querySelector('[role="dialog"]')
  if (dialog instanceof HTMLElement) {
    event.preventDefault()
    dialog.focus({ preventScroll: true })
  }
}

function handleFocusOutside(event: Event) {
  if (props.transitioning) {
    event.preventDefault()
  }
}
</script>

<template>
  <div class="contents">
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
        onOpenAutoFocus: focusContent,
      }"
      :ui="{ content: resolvedContentClass }"
      @update:open="emit('updateOpen', $event)"
    >
      <slot />
      <template #content>
        <slot name="content" />
      </template>
    </UPopover>
  </div>
</template>
