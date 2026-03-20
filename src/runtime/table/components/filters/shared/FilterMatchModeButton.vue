<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'

import type { TableFilterOperator } from '../../../types'

withDefaults(
  defineProps<{
    label: string
    items?: Array<{ label: string; value: TableFilterOperator }>
    variant?: 'default' | 'compact'
  }>(),
  {
    items: () => [],
    variant: 'default',
  },
)

const emit = defineEmits<{
  select: [value: TableFilterOperator]
}>()
</script>

<template>
  <UDropdownMenu
    :items="[
      items.map((item) => ({
        label: item.label,
        onSelect: () => emit('select', item.value),
      })),
    ]"
    :content="{ side: 'bottom', align: 'end', sideOffset: 6 }"
    :ui="{ content: 'w-fit p-1 shadow-none' }"
  >
    <UButton
      color="neutral"
      :variant="variant === 'compact' ? 'ghost' : 'outline'"
      :size="variant === 'compact' ? 'sm' : 'md'"
      :label="label"
      trailing-icon="i-lucide-chevron-down"
      :class="variant === 'compact' ? 'px-2.5' : undefined"
      @pointerdown.stop
      @click.stop
    />
  </UDropdownMenu>
</template>
