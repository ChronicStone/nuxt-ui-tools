<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'

defineProps<{
  label: string
  count?: number
  selected: boolean
}>()
</script>

<template>
  <div
    class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-elevated"
    :class="selected ? 'bg-elevated text-highlighted' : 'text-default'"
  >
    <UCheckbox :model-value="selected" color="neutral" size="md" tabindex="-1" />
    <span class="min-w-0 flex-1 truncate">{{ label }}</span>
    <span v-if="count != null" class="shrink-0 text-muted">{{ count }}</span>
  </div>
</template>
