<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{
  value?: string
  placeholder: string
  icon?: string
}>()
</script>

<template>
  <UButton
    color="neutral"
    variant="outline"
    size="md"
    class="w-full justify-between text-left"
  >
    <span class="flex min-w-0 items-center gap-3">
      <UIcon v-if="icon" :name="icon" class="size-4 shrink-0 text-muted" />
      <span
        class="min-w-0 truncate"
        :class="value ? 'text-default' : 'text-muted'"
      >
        {{ value || placeholder }}
      </span>
    </span>

    <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 text-muted" />
  </UButton>
</template>
