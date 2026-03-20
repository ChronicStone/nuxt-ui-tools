<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'

defineProps<{
  label: string
  count?: number
  countLoading?: boolean
  selected: boolean
  leadingIcon?: string
  selectedIcon?: string
  truncate?: boolean
}>()
</script>

<template>
  <div
    class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-elevated"
    :class="selected ? 'bg-elevated text-highlighted' : 'text-default'"
  >
    <UCheckbox
      :model-value="selected"
      color="neutral"
      size="md"
      tabindex="-1"
      :icon="selectedIcon"
      :ui="{ base: '!rounded-md', indicator: '!rounded-none' }"
    />

    <UIcon
      v-if="leadingIcon"
      :name="leadingIcon"
      class="size-4 shrink-0 text-muted"
    />

    <span class="min-w-0 flex-1" :class="(truncate ?? true) ? 'truncate' : ''">{{ label }}</span>
    <USkeleton v-if="countLoading" class="ml-3 h-3.5 w-6 shrink-0" />
    <span v-else-if="count != null" class="ml-3 shrink-0 text-muted">{{ count }}</span>
  </div>
</template>
