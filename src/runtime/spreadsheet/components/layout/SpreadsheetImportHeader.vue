<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="grid gap-1">
    <h1 class="text-[2rem] font-semibold leading-none tracking-[-0.06em] text-highlighted">
      {{ title }}
    </h1>
    <p v-if="description" class="text-sm text-toned">
      {{ description }}
    </p>
  </div>
</template>
