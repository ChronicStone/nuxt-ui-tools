<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'

const {
  disabled = false,
  kbds = undefined,
  pressed = undefined,
  tone = 'default',
} = defineProps<{
  icon: string
  label: string
  kbds?: string[]
  pressed?: boolean
  disabled?: boolean
  /** `inverted` sits on dark media, such as video controls. */
  tone?: 'default' | 'inverted'
}>()

defineEmits<{ click: [event: MouseEvent] }>()
defineOptions({ inheritAttrs: false })
</script>

<template>
  <UTooltip :text="label" :kbds="kbds" :disabled="disabled" :content="{ side: 'bottom' }">
    <UButton
      v-bind="$attrs"
      :icon="icon"
      :aria-label="label"
      :aria-pressed="pressed"
      :disabled="disabled"
      color="neutral"
      variant="ghost"
      size="sm"
      square
      :class="[
        'shrink-0',
        tone === 'inverted'
          ? 'text-white hover:bg-white/15 hover:text-white active:bg-white/20 disabled:bg-transparent'
          : pressed
            ? 'bg-elevated text-highlighted'
            : 'text-muted hover:text-highlighted',
      ]"
      @click="$emit('click', $event)"
    />
  </UTooltip>
</template>
