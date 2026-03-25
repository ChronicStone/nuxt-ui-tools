<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="inline-flex items-center gap-3 text-highlighted">
    <div
      class="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"
    >
      <UIcon name="i-lucide-box" class="size-4" />
    </div>

    <div v-if="!collapsed" class="grid gap-0.5">
      <span class="text-sm font-semibold tracking-tight">nuxt-ui-tools</span>
      <span class="text-[11px] uppercase tracking-[0.18em] text-toned">playground</span>
    </div>
  </div>
</template>
