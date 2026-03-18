<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{
  minHeight: string
}>()
</script>

<template>
  <div
    class="flex h-full w-full flex-col items-center justify-center gap-3 py-14"
    :style="{ minHeight }"
  >
    <UIcon name="i-lucide-database-zap" class="size-6 text-muted" />
    <div class="text-sm text-muted">No rows match the current state.</div>
  </div>
</template>
