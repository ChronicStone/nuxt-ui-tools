<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div class="grid min-w-0 gap-1">
      <h3 class="text-lg font-semibold tracking-[-0.015em] text-balance text-highlighted">
        {{ title }}
      </h3>
      <p v-if="description" class="max-w-[62ch] text-sm text-pretty text-muted">
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
